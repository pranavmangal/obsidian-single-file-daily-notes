import {
    App,
    Notice,
    PluginSettingTab,
    Setting,
    TFile,
    debounce,
    moment,
} from "obsidian";

import type SingleFileDailyNotes from "./main";
import { getDailyNotesFilePath, getHeadingMd } from "./utils";

export interface SingleFileDailyNotesSettings {
    noteName: string;
    noteLocation: string;
    headingType: string;
    dateFormat: string;
}

export class SingleFileDailyNotesSettingTab extends PluginSettingTab {
    plugin: SingleFileDailyNotes;

    constructor(app: App, plugin: SingleFileDailyNotes) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Name for daily notes file")
            .setDesc("Provide a custom name for the daily notes file")
            .addText((text) =>
                text
                    .setPlaceholder("Enter the file name")
                    .setValue(this.plugin.settings.noteName)
                    .onChange(async (value) => {
                        this.plugin.settings.noteName = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Location of daily notes file")
            .setDesc(
                "Provide a path where you want the daily notes file to live (leave empty for root)"
            )
            .addText((text) =>
                text
                    .setPlaceholder("Enter the path")
                    .setValue(this.plugin.settings.noteLocation)
                    .onChange(async (value) => {
                        this.plugin.settings.noteLocation = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Heading type for daily note sections")
            .setDesc(
                "Provide the type of heading that should be used for a daily note section (h1 to h6)"
            )
            .addText((text) =>
                text
                    .setPlaceholder("Enter the heading type")
                    .setValue(this.plugin.settings.headingType.toString())
                    .onChange(
                        debounce(async (value: string) => {
                            const headingRegex = /^h[1-6]$/;
                            if (!headingRegex.test(value)) {
                                new Notice(
                                    `Invalid heading type entered: "${value}"` +
                                        "\nPlease fix this in the plugin settings."
                                );
                                return;
                            } else {
                                this.plugin.settings.headingType = value;
                                await this.plugin.saveSettings();

                                this.updateHeadings(value);
                            }
                        }, 500)
                    )
            );

        const dateFormatSettingDescription = new DocumentFragment();
        dateFormatSettingDescription.createEl("span", {
            text: "Provide a custom ",
        });
        dateFormatSettingDescription.appendChild(
            createEl("a", {
                text: "moment.js compatible",
                href: "https://momentjs.com/docs/#/parsing/string-format/",
            })
        );
        dateFormatSettingDescription.appendText(
            " format string for using a different date format"
        );

        new Setting(containerEl)
            .setName("Date format for daily note headings")
            .setDesc(dateFormatSettingDescription)
            .addText((text) =>
                text
                    .setPlaceholder("Enter the format string")
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    updateHeadings(value: string) {
        const filePath = getDailyNotesFilePath(this.plugin.settings);

        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            this.app.vault.process(file, (data) => {
                const lines = data.split("\n");

                const dateFormat = this.plugin.settings.dateFormat;
                const dateHeadingRegex = /^(#{1,6}) (.*)/;
                const newHeading = getHeadingMd(this.plugin.settings);

                for (const [i, line] of lines.entries()) {
                    const match = dateHeadingRegex.exec(line);
                    if (match && moment(match[2], dateFormat, true).isValid()) {
                        lines[i] = line.replace(match[1], newHeading);
                    }
                }

                return lines.join("\n");
            });

            new Notice(`Updated daily note headings to ${value}`);
        }
    }
}
