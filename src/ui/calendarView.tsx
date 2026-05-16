import {
    type App,
    ItemView,
    MarkdownView,
    Modal,
    type TFile,
    type WorkspaceLeaf,
} from "obsidian";
import { createContext, StrictMode, useContext } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VIEW_TYPE_CALENDAR } from "../constants";
import type SingleFileDailyNotes from "../main";
import {
    getDailyNotesFile,
    getHeadingForDate,
    insertNoteForDate,
} from "../utils";
import Calendar from "./calendar";

export class CalendarView extends ItemView {
    plugin: SingleFileDailyNotes;
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: SingleFileDailyNotes) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_CALENDAR;
    }

    getDisplayText(): string {
        return "Calendar";
    }

    getIcon(): string {
        return "calendar-days";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <AppContext.Provider value={this.app}>
                <StrictMode>
                    <Calendar
                        onClickDate={(date) => {
                            void this.onClickDate(date);
                        }}
                    />
                </StrictMode>
            </AppContext.Provider>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }

    async onClickDate(date: moment.Moment) {
        const file = getDailyNotesFile(this.app, this.plugin.settings);
        if (file) {
            const contents = await this.app.vault.read(file);
            const noteIndex = this.containsNoteForDate(contents, date);

            if (noteIndex == null) {
                new CreateDailyNoteModal(
                    this.app,
                    date,
                    this.createNoteForDate.bind(this),
                ).open();

                return;
            } else {
                await this.goToNote(file, noteIndex);
            }
        }
    }

    async openDailyNotesTab(file: TFile) {
        const openTabs = this.app.workspace.getLeavesOfType("markdown");
        for (const tab of openTabs) {
            if (tab.getDisplayText() === this.plugin.settings.noteName) {
                await this.app.workspace.revealLeaf(tab);

                return tab;
            }
        }

        const newTab = this.app.workspace.getLeaf(true);
        await newTab.openFile(file);

        return newTab;
    }

    async scrollToNote(tab: WorkspaceLeaf, index: number) {
        await tab.setViewState({ type: "markdown", active: true });

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const pos = { line: index, ch: 0 };
            view.editor.scrollIntoView({ from: pos, to: pos }, true);
            view.editor.setCursor({ ...pos, line: pos.line + 1 });
        }
    }

    async goToNote(file: TFile, index: number) {
        const tab = await this.openDailyNotesTab(file);
        await this.scrollToNote(tab, index);
    }

    async createNoteForDate(date: moment.Moment) {
        const file = getDailyNotesFile(this.app, this.plugin.settings);

        if (file) {
            let index = 0;

            await this.app.vault.process(file, (fileContent) => {
                const fullNoteAndIndex = insertNoteForDate(
                    fileContent,
                    date,
                    this.plugin.settings,
                );

                index = fullNoteAndIndex[1];

                return fullNoteAndIndex[0];
            });

            await this.goToNote(file, index);
        }
    }

    containsNoteForDate(contents: string, date: moment.Moment) {
        const lines = contents.split("\n");

        const heading = getHeadingForDate(this.plugin.settings, date);
        const index = lines.findIndex((line) => line.includes(heading));
        if (index > -1) {
            return index;
        } else {
            return null;
        }
    }
}

export class CreateDailyNoteModal extends Modal {
    date: moment.Moment;
    create: (date: moment.Moment) => Promise<void>;

    constructor(
        app: App,
        date: moment.Moment,
        createNoteForDate: (date: moment.Moment) => Promise<void>,
    ) {
        super(app);
        this.date = date;
        this.create = createNoteForDate;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("h3", {
            text: `No daily note exists for ${this.date.format("DD-MM-YYYY")}. Would you like to create one?`,
        });

        contentEl.createDiv("modal-buttons", (buttons) => {
            buttons
                .createEl("button", { text: "No" })
                .addEventListener("click", () => this.close());

            buttons
                .createEl("button", { text: "Yes", cls: "mod-cta" })
                .addEventListener("click", () => {
                    this.create(this.date).then(() => {
                        this.close();
                    });
                });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

const AppContext = createContext<App | undefined>(undefined);
export const useApp = (): App | undefined => {
    return useContext(AppContext);
};
