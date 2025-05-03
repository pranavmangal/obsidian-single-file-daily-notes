import {
    App,
    moment,
    Notice,
    PluginSettingTab,
    Setting,
    TFile,
} from "obsidian";

import type SingleFileDailyNotes from "./main";
import { getDailyNotesFile, getHeadingMd } from "./utils";

export interface PluginSettings {
    noteName: string;
    noteEntry: string;
    noteLocation: string;
    headingType: string;
    dateFormat: string;
    monthFormat: string;
}

export const DEFAULT_SETTINGS: PluginSettings = Object.freeze({
    noteName: "Daily Notes",
    noteEntry: "- entry",
    noteLocation: "",
    headingType: "h3",
    dateFormat: "DD-MM-YYYY, dddd",
    monthFormat: "MMMM YYYY",
});

export class SettingsTab extends PluginSettingTab {
    plugin: SingleFileDailyNotes;

    constructor(app: App, plugin: SingleFileDailyNotes) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        this.containerEl.empty();

        this.fileNameSetting();
        this.nodeEntrySetting();
        this.filePathSetting();
        this.headingTypeSetting();
        this.dateFormatSetting();
        this.monthFormatSetting();
    }

    private fileNameSetting() {
        new Setting(this.containerEl)
            .setName("Name for daily notes file")
            .setDesc("Provide a custom name for the daily notes file")
            .addText((text) =>
                text
                    .setPlaceholder("Enter the file name")
                    .setValue(this.plugin.settings.noteName)
                    .onChange(async (value) => {
                        this.plugin.settings.noteName = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    private nodeEntrySetting() {
        new Setting(this.containerEl)
            .setName("Default entry for daily note")
            .setDesc(
                "Provide a custom note entry for a newly created daily note",
            )
            .addTextArea((text) =>
                text
                    .setPlaceholder("Enter the note")
                    .setValue(this.plugin.settings.noteEntry)
                    .onChange(async (value) => {
                        this.plugin.settings.noteEntry = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    private filePathSetting() {
        new Setting(this.containerEl)
            .setName("Location of daily notes file")
            .setDesc(
                "Provide a path where you want the daily notes file to live (leave empty for root)",
            )
            .addText((text) =>
                text
                    .setPlaceholder("Enter the path")
                    .setValue(this.plugin.settings.noteLocation)
                    .onChange(async (value) => {
                        this.plugin.settings.noteLocation = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    private headingTypeSetting() {
        new Setting(this.containerEl)
            .setName("Heading type for daily note sections")
            .setDesc(
                "Provide the type of heading that should be used for a daily note section",
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        h2: "h2",
                        h3: "h3",
                        h4: "h4",
                        h5: "h5",
                        h6: "h6",
                    })
                    .setValue(this.plugin.settings.headingType)
                    .onChange(async (value) => {
                        this.plugin.settings.headingType = value;
                        await this.plugin.saveSettings();

                        this.updateHeadings(value);
                    }),
            );
    }

    private updateHeadings(value: string) {
        const file = getDailyNotesFile(this.app, this.plugin.settings);

        if (file instanceof TFile) {
            this.app.vault.process(file, (data) => {
                const lines = data.split("\n");

                const dateFormat = this.plugin.settings.dateFormat;
                const monthFormat = this.plugin.settings.monthFormat;
                const dateHeadingRegex = /^(#{1,6}) (.*)/;
                const newHeading = getHeadingMd(this.plugin.settings);

                for (const [i, line] of lines.entries()) {
                    const match = dateHeadingRegex.exec(line);
                    if (!match) continue;

                    if (moment(match[2], dateFormat, true).isValid()) {
                        lines[i] = line.replace(match[1], newHeading);
                    } else if (moment(match[2], monthFormat, true).isValid()) {
                        lines[i] = line.replace(match[1], newHeading.slice(1));
                    }
                }

                return lines.join("\n");
            });

            new Notice(`Updated daily note headings to ${value}`);
        }
    }

    private dateFormatSetting() {
        const description = new DocumentFragment();
        description.createEl("span", { text: "Provide a custom " });
        description.appendChild(
            createEl("a", {
                text: "moment.js compatible",
                href: "https://momentjs.com/docs/#/parsing/string-format/",
            }),
        );
        description.appendText(
            " format string for using a different date format",
        );

        new Setting(this.containerEl)
            .setName("Date format for daily note headings")
            .setDesc(description)
            .addText((text) =>
                text
                    .setPlaceholder("Enter the format string")
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }

    private monthFormatSetting() {
        const description = new DocumentFragment();
        description.createEl("span", { text: "Provide a custom " });
        description.appendChild(
            createEl("a", {
                text: "moment.js compatible",
                href: "https://momentjs.com/docs/#/parsing/string-format/",
            }),
        );
        description.appendText(
            " format string for using a different format for month headings",
        );

        new Setting(this.containerEl)
            .setName("Date format for month headings")
            .setDesc(description)
            .addText((text) =>
                text
                    .setPlaceholder("Enter the format string")
                    .setValue(this.plugin.settings.monthFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.monthFormat = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
