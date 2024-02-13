import { SingleFileDailyNotesSettings } from "./settings";

/**
 * Returns the path for the daily notes file for the given settings
 * @param settings
 * @returns string - the path of the daily notes file
 */
export const getDailyNotesFilePath = (
    settings: SingleFileDailyNotesSettings,
) => {
    const file = settings.noteName + ".md";

    if (settings.noteLocation == "") {
        return file;
    } else {
        return settings.noteLocation + "/" + file;
    }
};

export const getHeadingLevel = (settings: SingleFileDailyNotesSettings) => {
    return parseInt(settings.headingType[1]);
};

export const getHeadingMd = (settings: SingleFileDailyNotesSettings) => {
    return "#".repeat(getHeadingLevel(settings));
};
