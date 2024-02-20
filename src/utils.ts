import {moment} from "obsidian";

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

export const getHeadingLevel = (settings: PluginSettings) => {
    return parseInt(settings.headingType[1]);
};

export const getHeadingMd = (settings: PluginSettings) => {
    return "#".repeat(getHeadingLevel(settings));
};

export const getTodayHeading = (settings: PluginSettings): string => {
    return (
        getHeadingMd(settings) +
        " " +
        moment().format(settings.dateFormat)
    );
}
