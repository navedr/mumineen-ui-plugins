import { HijriDate } from "./HijriDate";
import Lazy from "lazy.js";

const MIN_CALENDAR_YEAR = 1000;
const MAX_CALENDAR_YEAR = 3000;

export type Day = {
    hijri: {
        year: number;
        month: number;
        date: number;
    };
    gregorian: {
        year: number;
        month: number;
        date: number;
    };
    ajd: any;
    filler: boolean;
};

export class HijriCalendar {
    constructor(private year, private month, private iso8601 = false) {}

    public getYear() {
        return this.year;
    }

    public getMonth() {
        return this.month;
    }

    public isISO() {
        return this.iso8601;
    }

    public getMinYear() {
        return MIN_CALENDAR_YEAR;
    }

    public getMaxYear() {
        return MAX_CALENDAR_YEAR;
    }

    // return day of week for the specified date
    public dayOfWeek(date) {
        var hijriDate = new HijriDate(this.year, this.month, date),
            offset = this.iso8601 ? 0.5 : 1.5;
        return (hijriDate.toAJD() + offset) % 7;
    }

    // return array of days of this month and year
    public days() {
        const self = this;
        return Lazy.generate(function (day) {
            var hijriDate = new HijriDate(self.year, self.month, day + 1),
                gregorianDate = hijriDate.toGregorian();
            return self.dayHash(hijriDate, gregorianDate);
        }, HijriDate.daysInMonth(this.year, this.month));
    }

    // return array of weeks for this month and year
    public weeks() {
        return Lazy([]).concat(this.previousDays(), this.days(), this.nextDays()).chunk(7).toArray();
    }

    // return array of days from beginning of week until start of this month and year
    public previousDays() {
        var previousMonth = this.previousMonth(),
            daysInPreviousMonth = HijriDate.daysInMonth(previousMonth.getYear(), previousMonth.getMonth()),
            dayAtStartOfMonth = this.dayOfWeek(1);

        if (this.month === 0 && this.year === MIN_CALENDAR_YEAR) return Lazy.repeat(null, 6 - dayAtStartOfMonth);
        const self = this;
        return Lazy.generate(function (day) {
            const hijriDate = new HijriDate(
                    previousMonth.getYear(),
                    previousMonth.getMonth(),
                    daysInPreviousMonth - dayAtStartOfMonth + day + 1,
                ),
                gregorianDate = hijriDate.toGregorian();
            return self.dayHash(hijriDate, gregorianDate, true);
        }, dayAtStartOfMonth);
    }

    // return array of days from end of this month and year until end of the week
    public nextDays() {
        var nextMonth = this.nextMonth(),
            daysInMonth = HijriDate.daysInMonth(this.year, this.month),
            dayAtEndOfMonth = this.dayOfWeek(daysInMonth);

        if (nextMonth.getYear() === this.year && nextMonth.getMonth() === this.month)
            return Lazy.repeat(null, 6 - dayAtEndOfMonth);
        const self = this;
        return Lazy.generate(function (day) {
            var hijriDate = new HijriDate(nextMonth.getYear(), nextMonth.getMonth(), day + 1),
                gregorianDate = hijriDate.toGregorian();
            return self.dayHash(hijriDate, gregorianDate, true);
        }, 6 - dayAtEndOfMonth);
    }

    // return Hijri Calendar object for the previous month
    public previousMonth() {
        var year = this.month === 0 && this.year > MIN_CALENDAR_YEAR ? this.year - 1 : this.year,
            month;

        if (this.month === 0 && this.year === MIN_CALENDAR_YEAR) month = this.month;
        else if (this.month === 0) month = 11;
        else month = this.month - 1;

        return new HijriCalendar(year, month, this.iso8601);
    }

    // return Hijri Calendar object for the next month
    public nextMonth() {
        var year = this.month === 11 && this.year < MAX_CALENDAR_YEAR ? this.year + 1 : this.year,
            month;

        if (this.month === 11 && this.year === MAX_CALENDAR_YEAR) month = this.month;
        else if (this.month === 11) month = 0;
        else month = this.month + 1;

        return new HijriCalendar(year, month, this.iso8601);
    }

    // return Hijri Calendar object for the previous year
    public previousYear() {
        var year = this.year === MIN_CALENDAR_YEAR ? MIN_CALENDAR_YEAR : this.year - 1;
        return new HijriCalendar(year, this.month, this.iso8601);
    }

    // return Hijri Calendar object for the next year
    public nextYear() {
        var year = this.year === MAX_CALENDAR_YEAR ? MAX_CALENDAR_YEAR : this.year + 1;
        return new HijriCalendar(year, this.month, this.iso8601);
    }

    private dayHash(hijriDate, gregorianDate, isFiller = false): Day {
        return {
            hijri: {
                year: hijriDate.getYear(),
                month: hijriDate.getMonth(),
                date: hijriDate.getDate(),
            },
            gregorian: {
                year: gregorianDate.getFullYear(),
                month: gregorianDate.getMonth(),
                date: gregorianDate.getDate(),
            },
            ajd: hijriDate.toAJD(),
            filler: isFiller ? true : undefined,
        };
    }
}
