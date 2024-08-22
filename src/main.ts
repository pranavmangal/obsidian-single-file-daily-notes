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

import { DEFAULT_SETTINGS, PluginSettings, SettingsTab } from "./settings";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { CalendarView } from "./ui/calendarView";
import {
    getDailyNotesFilePath,
    getHeadingMd,
    getMonthSection,
    getTodayHeading,
    getTodaySection,
} from "./utils";

export default class SingleFileDailyNotes extends Plugin {
    settings: PluginSettings;
    view: CalendarView;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new SettingsTab(this.app, this));

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
                this.showCalendar();
            },
        });

        this.addCommand({
            id: "hide-calendar-view",
            name: "Hide calendar",
            callback: () => {
                this.hideCalendar();
            },
        });

        this.addRibbonIcon("calendar-days", "Open daily notes", () => {
            this.openOrCreateDailyNotesFile();
        });

        this.registerView(
            VIEW_TYPE_CALENDAR,
            (leaf: WorkspaceLeaf) => (this.view = new CalendarView(leaf, this)),
        );

        if (this.app.workspace.layoutReady) {
            await this.showCalendar();
        }

        // --------------------------------------------------------------------
        this.app.workspace.on("file-open", this.onFileOpen.bind(this));
        this.app.vault.on("rename", this.onRename.bind(this));
    }

    async showCalendar() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
        }

        workspace.revealLeaf(leaf);
    }

    async hideCalendar() {
        const { workspace } = this.app;

        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
        for (const leaf of leaves) {
            leaf.detach();
        }
    }

    // ------------------------------------------------------------------------

    /**
     * Updates the settings to reflect new daily notes file name or path
     * @param file - renamed file or folder
     * @param oldPath - old path of renamed entity
     */
    async onRename(file: TAbstractFile, oldPath: string) {
        const { settings } = this;

        const currentPath = getDailyNotesFilePath(settings);

        if (file instanceof TFile && oldPath == currentPath) {
            settings.noteName = file.basename;
        }

        if (file instanceof TFolder && currentPath.startsWith(oldPath)) {
            const newPath = file.path + currentPath.substring(oldPath.length);
            const justPath = newPath.substring(0, newPath.lastIndexOf("/"));
            settings.noteLocation = justPath;
        }

        await this.saveSettings();
    }

    skipCursorPositioning = false;

    /**
     * Updates the daily notes file if it is opened
     * @param file - opened file
     */
    async onFileOpen(file: TFile) {
        if (file && file.path == getDailyNotesFilePath(this.settings)) {
            await this.updateDailyNote(file);

            if (!this.skipCursorPositioning) {
                await this.positionCursor(file);
            } else {
                this.skipCursorPositioning = false;
            }
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
            await view.leaf.setViewState({ type: "markdown", active: true });

            const fileContent = await this.app.vault.read(file);
            const lines = fileContent.split("\n");

            // Skip to today's section
            let i = 0;
            while (!lines[i].startsWith(getTodayHeading(this.settings))) {
                i++;
            }

            // Move to the first line of today's section
            i++;

            if (lines[i] == this.settings.noteEntry) {
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
        const { vault, workspace } = this.app;

        if (this.settings.noteName == "") {
            new Notice(
                "Daily notes file name cannot be empty. Change this in the plugin settings.",
            );
            return;
        }

        const filePath = getDailyNotesFilePath(this.settings);

        let file = vault.getAbstractFileByPath(filePath);
        if (!file) {
            file = await vault.create(filePath, "");
        }

        if (file instanceof TFile) {
            await workspace.getLeaf().openFile(file);
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
     * @returns updated daily notes file
     */
    updatedNote(data: string): string {
        const lines = data.split("\n");

        const todayHeading = getTodayHeading(this.settings);
        const hasTodaySection = lines.some((line) =>
            line.startsWith(todayHeading),
        );

        if (!hasTodaySection) {
            let updatedFile = data;

            if (moment().date() == 1) {
                updatedFile = getMonthSection(this.settings) + updatedFile;
            }

            updatedFile = getTodaySection(this.settings) + updatedFile;

            return updatedFile;
        }

        return data;
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
