import {
    MarkdownView,
    Notice,
    Plugin,
    TAbstractFile,
    TFile,
    TFolder,
    WorkspaceLeaf,
    moment,
} from "obsidian";

import {
    SingleFileDailyNotesSettingTab,
    SingleFileDailyNotesSettings,
} from "./settings";
import { getDailyNotesFilePath, getHeadingLevel, getHeadingMd } from "./utils";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { CalendarView } from "./calendarView";

const DEFAULT_SETTINGS: SingleFileDailyNotesSettings = Object.freeze({
    noteName: "Daily Notes",
    noteLocation: "",
    headingType: "h3",
    dateFormat: "DD-MM-YYYY, dddd",
});

const DEFAULT_DUMMY_ENTRY = "- entry";

export default class SingleFileDailyNotes extends Plugin {
    settings: SingleFileDailyNotesSettings;
    view: CalendarView;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new SingleFileDailyNotesSettingTab(this.app, this));

        this.addCommand({
            id: "open-daily-notes",
            name: "Open daily notes",
            callback: () => {
                this.openOrCreateDailyNotesFile();
            },
        });

        this.addCommand({
            id: "show-calendar-view",
            name: "Show calendar",
            callback: () => {
                this.activateView();
            },
        });

        this.addRibbonIcon("calendar-days", "Open daily notes", () => {
            this.openOrCreateDailyNotesFile();
        });

        this.registerView(
            VIEW_TYPE_CALENDAR,
            (leaf: WorkspaceLeaf) => (this.view = new CalendarView(leaf)),
        );

        if (this.app.workspace.layoutReady) {
            this.activateView();
        }

        // --------------------------------------------------------------------
        this.app.workspace.on("file-open", this.onFileOpen.bind(this));
        this.app.vault.on("rename", this.onRename.bind(this));
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }

    // ------------------------------------------------------------------------

    /**
     * Updates the settings to reflect new daily notes file name or path
     * @param file - renamed file or folder
     * @param oldPath - old path of renamed entity
     */
    async onRename(file: TAbstractFile, oldPath: string) {
        const currentPath = getDailyNotesFilePath(this.settings);

        if (file instanceof TFile && oldPath == currentPath) {
            this.settings.noteName = file.basename;
        }

        if (file instanceof TFolder && currentPath.startsWith(oldPath)) {
            const newPath = file.path + currentPath.substring(oldPath.length);
            const justPath = newPath.substring(0, newPath.lastIndexOf("/"));
            this.settings.noteLocation = justPath;
        }

        await this.saveSettings();
    }

    /**
     * Updates the daily notes file if it is opened
     * @param file - opened file
     */
    async onFileOpen(file: TFile) {
        if (file && file.path == getDailyNotesFilePath(this.settings)) {
            await this.updateDailyNote(file);
            await this.positionCursor(file);
        }
    }

    // ------------------------------------------------------------------------

    /**
     * Tries to intelligently position the cursor in the daily notes file
     * @param file - daily notes file
     */
    async positionCursor(file: TFile) {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const fileContent = await this.app.vault.read(file);
            const lines = fileContent.split("\n");

            // Skip to today's section
            let i = 0;
            while (!lines[i].startsWith(this.getTodayHeading())) {
                i++;
            }

            // Move to the first line of today's section
            i++;

            if (lines[i] == DEFAULT_DUMMY_ENTRY) {
                // Select the dummy entry
                view.editor.setSelection(
                    { line: i, ch: 2 },
                    { line: i, ch: lines[i].length },
                );
            } else {
                // Move cursor to the end of today's section
                while (!lines[i].startsWith(getHeadingMd(this.settings))) {
                    i++;
                }

                view.editor.setCursor(i - 1, lines[i - 1].length);
            }
        }
    }

    // ------------------------------------------------------------------------

    /**
     * Opens daily notes file and creates one if it doesn't exist
     */
    async openOrCreateDailyNotesFile() {
        if (this.settings.noteName == "") {
            new Notice(
                "Daily notes file name cannot be empty. Change this in the plugin settings.",
            );
            return;
        }

        const filePath = getDailyNotesFilePath(this.settings);

        let file = this.app.vault.getAbstractFileByPath(filePath);
        if (!file) {
            file = await this.app.vault.create(filePath, "");
        }

        if (file instanceof TFile) {
            await this.app.workspace.getLeaf().openFile(file);
        }
    }

    // ------------------------------------------------------------------------

    /**
     * Updates the daily notes file with today's note
     * @param file - daily notes file to update
     */
    async updateDailyNote(file: TFile) {
        return this.app.vault.process(file, (data) => {
            return this.updatedNote(data);
        });
    }

    /**
     * Returns updated daily notes file
     * @param data - current daily notes file
     * @returns upated daily notes file
     */
    updatedNote(data: string): string {
        const lines = data.split("\n");

        const todayHeading = this.getTodayHeading();
        const hasTodaySection = lines.some((line) =>
            line.startsWith(todayHeading),
        );

        if (!hasTodaySection) {
            let updatedFile = data;

            if (moment().date() == 1) {
                const monthSection =
                    "\n---\n" +
                    "#".repeat(getHeadingLevel(this.settings) - 1) +
                    " " +
                    moment().subtract(1, "day").format("MMMM YYYY") +
                    "\n";

                updatedFile = monthSection + updatedFile;
            }

            const todaySection =
                todayHeading + "\n" + DEFAULT_DUMMY_ENTRY + "\n";
            updatedFile = todaySection + updatedFile;

            return updatedFile;
        }

        return data;
    }

    // ------------------------------------------------------------------------

    /**
     * Generates the heading for a daily note section with today's date
     */
    getTodayHeading(): string {
        return (
            getHeadingMd(this.settings) +
            " " +
            moment().format(this.settings.dateFormat)
        );
    }

    // ------------------------------------------------------------------------

    onunload() {
        this.app.workspace
            .getLeavesOfType(VIEW_TYPE_CALENDAR)
            .forEach((leaf) => leaf.detach());

        this.app.workspace.off("file-open", this.onFileOpen);
        this.app.vault.off("rename", this.onRename);
    }

    // ------------------------------------------------------------------------

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
