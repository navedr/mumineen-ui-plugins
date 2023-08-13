import { Miqaat, MiqaatMonth } from "./HijriCalender.interface";
import { Day } from "./libs/HijriCalendar";
import * as React from "react";
import { HijriDate } from "./libs/HijriDate";
import { DateUtil } from "./libs/date";

export const useDayMiqaats = (miqaats: MiqaatMonth[], day: Day): Miqaat[] => {
    const { hijri } = day;
    return miqaats
        .filter(({ date, month }) => date == hijri.date && month == hijri.month)
        .map(({ miqaats }) => miqaats)
        .flat()
        .filter(miqaat => !(miqaat.year && miqaat.year > hijri.year));
};

export const getHijriDate = (day: Day) => {
    if (day && day.hijri) {
        const {
            hijri: { date, month, year },
        } = day;
        return `${date.toString()} ${HijriDate.getMonthName(month)} ${year.toString()} H`;
    }
};

export const getGregorianDate = (day: Day) => {
    if (day && day.gregorian) {
        const {
            gregorian: { date, month, year },
        } = day;
        return `${date.toString()} ${DateUtil.getMonthName(month)} ${year.toString()} AD`;
    }
};

/**
 * Returns a function that will call the given handler and prevent the default event behavior.
 * @param handler: The handler to call.
 */
export const preventDefault = (handler?: (event: any) => void) => (event: any) => {
    event.preventDefault();
    handler && handler(event);
};
