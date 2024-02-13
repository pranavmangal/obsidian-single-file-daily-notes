import { ItemView, WorkspaceLeaf } from "obsidian";

import React, { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

import Calendar from "./ui/calendar";
import { VIEW_TYPE_CALENDAR } from "./constants";

export class CalendarView extends ItemView {
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
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
            <StrictMode>
                <Calendar />
            </StrictMode>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}
