import {
    MarkdownView,
    Notice,
    Plugin,
    type TAbstractFile,
    TFile,
    TFolder,
    type WorkspaceLeaf,
} from "obsidian";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { DEFAULT_SETTINGS, type PluginSettings, SettingsTab } from "./settings";
import { CalendarView } from "./ui/calendarView";
import {
    getDailyNotesFilePath,
    getHeadingMd,
    getTodayHeading,
    insertNoteForDate,
    moment,
} from "./utils";

export default class SingleFileDailyNotes extends Plugin {
    settings!: PluginSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new SettingsTab(this.app, this));

        this.addCommand({
            id: "open-daily-notes",
            name: "Open daily notes",
            callback: async () => {
                await this.openOrCreateDailyNotesFile();
            },
        });

        this.addCommand({
            id: "show-calendar-view",
            name: "Show calendar",
            callback: async () => {
                await this.showCalendar();
            },
        });

        this.addCommand({
            id: "hide-calendar-view",
            name: "Hide calendar",
            callback: async () => {
                await this.hideCalendar();
            },
        });

        this.addRibbonIcon("calendar-days", "Open daily notes", async () => {
            await this.openOrCreateDailyNotesFile();
        });

        this.registerView(
            VIEW_TYPE_CALENDAR,
            (leaf: WorkspaceLeaf) => new CalendarView(leaf, this),
        );

        if (this.app.workspace.layoutReady) {
            await this.showCalendar();
        }

        // --------------------------------------------------------------------
        this.registerEvent(
            this.app.workspace.on("file-open", (file) => this.onFileOpen(file)),
        );
        this.registerEvent(
            this.app.vault.on("rename", (file, oldPath) =>
                this.onRename(file, oldPath),
            ),
        );
    }

    async showCalendar() {
        const { workspace } = this.app;

        await workspace.ensureSideLeaf(VIEW_TYPE_CALENDAR, "right", {
            reveal: true,
            active: true,
        });
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

        if (file instanceof TFile && oldPath === currentPath) {
            settings.noteName = file.basename;
        }

        if (file instanceof TFolder && currentPath.startsWith(oldPath)) {
            const newPath = file.path + currentPath.substring(oldPath.length);
            const justPath = newPath.substring(0, newPath.lastIndexOf("/"));
            settings.noteLocation = justPath;
        }

        await this.saveSettings();
    }

    /**
     * Updates the daily notes file if it is opened
     * @param file - opened file
     */
    async onFileOpen(file: TFile | null) {
        if (
            file &&
            file.path === getDailyNotesFilePath(this.settings) &&
            this.settings.autoCreateNoteOnFileOpen
        ) {
            const newlyCreated = await this.updateDailyNote(file);

            if (newlyCreated) {
                await this.positionCursor(file);
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

            const todayHeading = getTodayHeading(this.settings);

            // Skip to today's section
            let i = 0;
            while (!lines[i].startsWith(todayHeading)) {
                i++;
            }

            // Move to the first line of today's section
            i++;

            if (lines[i] === this.settings.noteEntry) {
                // Select the dummy entry
                view.editor.setSelection(
                    { line: i, ch: 2 },
                    { line: i, ch: lines[i].length },
                );
            } else {
                // Move cursor to the end of today's section
                const headingMd = getHeadingMd(this.settings);
                while (!lines[i].startsWith(headingMd)) {
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

        if (this.settings.noteName === "") {
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
     * @returns true if today's note was newly created, false if it already existed
     */
    async updateDailyNote(file: TFile): Promise<boolean> {
        const fileContent = await this.app.vault.read(file);
        const [updatedNote] = insertNoteForDate(
            fileContent,
            moment(),
            this.settings,
        );

        if (updatedNote !== fileContent) {
            await this.app.vault.modify(file, updatedNote);
            return true;
        }

        return false;
    }

    // ------------------------------------------------------------------------

    onunload() {
        this.app.workspace
            .getLeavesOfType(VIEW_TYPE_CALENDAR)
            .forEach((leaf) => {
                leaf.detach();
            });
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
