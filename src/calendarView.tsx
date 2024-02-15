import { App, ItemView, WorkspaceLeaf } from "obsidian";

import React, { createContext, StrictMode, useContext } from "react";
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
            <AppContext.Provider value={this.app}>
                <StrictMode>
                    <Calendar
                        onClickDay={(date) => {
                            console.log(date.format("YYYY-MM-DD"));
                            return true;
                        }}
                    />
                </StrictMode>
            </AppContext.Provider>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

const AppContext = createContext<App | undefined>(undefined);
export const useApp = (): App | undefined => {
    return useContext(AppContext);
};
