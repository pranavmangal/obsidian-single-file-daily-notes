import { App, moment, TFile } from "obsidian";
import { Moment } from "moment";

import { PluginSettings } from "./settings";

/**
 * Returns the path for the daily notes file for the given settings
 * @param settings
 * @returns string - the path of the daily notes file
 */
export const getDailyNotesFilePath = (settings: PluginSettings) => {
    const file = settings.noteName + ".md";

    if (settings.noteLocation == "") {
        return file;
    } else {
        return settings.noteLocation + "/" + file;
    }
};

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

export const getHeadingLevel = (settings: PluginSettings) => {
    return parseInt(settings.headingType[1]);
};

export const getHeadingMd = (settings: PluginSettings) => {
    return "#".repeat(getHeadingLevel(settings));
};

export const getHeadingForDate = (
    settings: PluginSettings,
    date: Moment,
): string => {
    return getHeadingMd(settings) + " " + date.format(settings.dateFormat);
};

export const getTodayHeading = (settings: PluginSettings): string => {
    return getHeadingForDate(settings, moment());
};
