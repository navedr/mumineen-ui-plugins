import * as React from "react";
import { MiqaatMonth } from "./HijriCalender.interface";
import { ArabicNumerals } from "./libs/ArabicNumerals";
import { DateUtil } from "./libs/date";
import { classSet } from "./libs/classSet";
import { Day } from "./libs/HijriCalendar";

export const CalendarDay: React.FC<{ today: any; onDayClick: (day: Day) => void; day: Day; miqaats?: MiqaatMonth[] }> =
    React.memo(({ today, onDayClick, day, miqaats }) => {
        const isToday = React.useMemo(
            () =>
                day.hijri.year === today.getYear() &&
                day.hijri.month === today.getMonth() &&
                day.hijri.date === today.getDate(),
            [day, today],
        );

        const dayClassName = React.useMemo(
            () =>
                classSet({
                    day: !day.filler,
                    filler: day.filler,
                    today: isToday,
                }),
            [day, isToday],
        );

        const iconClassName = React.useMemo(() => {
            var firstMiqaat = miqaats
                .filter(({ date }) => date == day.hijri.date)
                .map(({ miqaats }) => miqaats)
                .flat()
                .filter(function (miqaat) {
                    return miqaat.year ? miqaat.year <= day.hijri.year : true;
                })[0];

            if (!firstMiqaat || day.filler) {
                return null;
            }
            return classSet({
                "icon-sun": firstMiqaat.priority === 1 && firstMiqaat.phase === "day",
                "icon-moon": firstMiqaat.priority === 1 && firstMiqaat.phase === "night",
                "icon-circle": firstMiqaat.priority > 1,
            });
        }, [miqaats, day]);

        const hijriDateString = React.useMemo(() => ArabicNumerals.fromInteger(day.hijri.date), [day]);

        const gregorianDateString = React.useMemo(() => {
            var { gregorian } = day,
                dateString = gregorian.date.toString();
            if (!day.filler) {
                if (day.hijri.date === 1 || gregorian.date === 1) {
                    dateString += " " + DateUtil.getShortMonthName(gregorian.month);
                }
                if (day.hijri.date === 1 || (gregorian.month === 0 && gregorian.date === 1)) {
                    dateString += " " + gregorian.year.toString();
                }
            }
            return dateString;
        }, [day]);

        const onDayClicked = React.useCallback(
            day => {
                if (!day.filler) {
                    onDayClick(day);
                }
                return false;
            },
            [day, onDayClick],
        );

        return (
            <td className={dayClassName} onClick={onDayClicked.bind(null, day)}>
                <div className="hijri">{hijriDateString}</div>
                <div className="gregorian">{gregorianDateString}</div>
                <div className="day-icon">
                    <i className={iconClassName} />
                </div>
            </td>
        );
    });
