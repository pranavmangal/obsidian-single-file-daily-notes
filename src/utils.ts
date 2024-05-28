import { App, moment, TFile } from "obsidian";
import { Moment } from "moment";

import { PluginSettings } from "./settings";
import { DEFAULT_DUMMY_ENTRY } from "./constants";

/**
 * Returns the path for the daily notes file
 */
export const getDailyNotesFilePath = (settings: PluginSettings) => {
    const file = settings.noteName + ".md";

    if (settings.noteLocation == "") {
        return file;
    } else {
        return settings.noteLocation + "/" + file;
    }
};

/**
 * Returns the daily notes file
 */
export const getDailyNotesFile = (
    app: App,
    settings: PluginSettings,
): TFile | null => {
    const path = getDailyNotesFilePath(settings);
    const file = app.vault.getAbstractFileByPath(path);

    if (file && file instanceof TFile) {
        return file;
    } else {
        return null;
    }
};

/**
 * Returns the level of headingType from settings
 * @example
 * getHeadingLevel({headingType: "h3"})
 * // Returns 3
 */
export const getHeadingLevel = (settings: PluginSettings): number => {
    return parseInt(settings.headingType[1]);
};

/**
 * Generates the Markdown for a heading
 * @example
 * getHeadingMd({headingType: "h3"})
 * // Returns ###
 */
export const getHeadingMd = (settings: PluginSettings): string => {
    return "#".repeat(getHeadingLevel(settings));
};

/**
 * Generates a daily note section heading for a date
 * @example
 * getHeadingForDate({headingType: "h3", dateFormat: "DD-MM-YYYY, dddd"}, date(29-05-24))
 * // Returns ### 29-05-2024, Wednesday
 */
export const getHeadingForDate = (
    settings: PluginSettings,
    date: Moment,
): string => {
    return getHeadingMd(settings) + " " + date.format(settings.dateFormat);
};

/**
 * Generates a daily note section heading for today.
 *
 * See {@link getHeadingForDate}
 */
export const getTodayHeading = (settings: PluginSettings): string => {
    return getHeadingForDate(settings, moment());
};

export const getTodaySection = (settings: PluginSettings): string => {
    return (
        getHeadingForDate(settings, moment()) +
        "\n" +
        DEFAULT_DUMMY_ENTRY +
        "\n"
    );
};

export const getMonthSection = (settings: PluginSettings): string => {
    return (
        "\n" +
        "---\n" +
        "#".repeat(getHeadingLevel(settings) - 1) +
        " " +
        moment().subtract(1, "day").format("MMMM YYYY") +
        "\n"
    );
};
