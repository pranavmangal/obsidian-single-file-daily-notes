import {
    App,
    ItemView,
    MarkdownView,
    Modal,
    TFile,
    WorkspaceLeaf,
} from "obsidian";
import { Moment } from "moment";

import React, { createContext, StrictMode, useContext } from "react";
import { createRoot, Root } from "react-dom/client";

import SingleFileDailyNotes from "./main";
import { VIEW_TYPE_CALENDAR } from "./constants";
import Calendar from "./ui/calendar";
import { getDailyNotesFile, getHeadingForDate } from "./utils";

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
                    <Calendar onClickDate={(date) => this.onClickDate(date)} />
                </StrictMode>
            </AppContext.Provider>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }

    async onClickDate(date: Moment) {
        const file = getDailyNotesFile(this.app, this.plugin.settings);
        if (file) {
            const contents = await this.app.vault.read(file);
            const noteIndex = this.containsNoteForDate(contents, date);

            if (!noteIndex) {
                new CreateDailyNoteModal(
                    this.app,
                    date,
                    this.createNoteForDate.bind(this),
                ).open();

                return;
            } else {
                await this.goToNoteFor(file, noteIndex);
            }
        }
    }

    async openDailyNotesTab(file: TFile) {
        const openTabs = this.app.workspace.getLeavesOfType("markdown");
        for (const tab of openTabs) {
            if (tab.getDisplayText() == this.plugin.settings.noteName) {
                this.app.workspace.revealLeaf(tab);

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

    async goToNoteFor(file: TFile, index: number) {
        const tab = await this.openDailyNotesTab(file);
        await this.scrollToNote(tab, index);
    }

    containsNoteForDate(contents: string, date: Moment) {
        const lines = contents.split("\n");

        const heading = getHeadingForDate(this.plugin.settings, date);
        const index = lines.findIndex((line) => line.includes(heading));
        if (index > -1) {
            return index;
        } else {
            return null;
        }
    }

    async createNoteForDate(date: Moment) {
        const file = getDailyNotesFile(this.app, this.plugin.settings);
        // Create note at index
        const index = 1;

        if (file) {
            await this.goToNoteFor(file, index);
        }
    }
}

export class CreateDailyNoteModal extends Modal {
    date: Moment;
    create: (date: Moment) => Promise<void>;

    constructor(
        app: App,
        date: Moment,
        createNoteForDate: (date: Moment) => Promise<void>,
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
                .addEventListener("click", async () => {
                    await this.create(this.date);
                    this.close();
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
