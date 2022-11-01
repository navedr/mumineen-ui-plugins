import * as React from "react";
import { MiqaatList } from "./MiqaatList";
import { HijriDate } from "./libs/HijriDate";
import { MiqaatMonth } from "./HijriCalender.interface";
import { DateUtil } from "./libs/date";
import { Day } from "./libs/HijriCalendar";

export const Modal: React.FC<{
    day: Day;
    modalId: string;
    miqaats?: MiqaatMonth[];
    additionalContent?: (day: Day) => React.ReactNode;
}> = React.memo(({ day, modalId, miqaats, additionalContent }) => {
    const hijriDate = React.useMemo(() => {
        if (day && day.hijri) {
            const {
                hijri: { date, month, year },
            } = day;
            return `${date.toString()} ${HijriDate.getMonthName(month)} ${year.toString()} H`;
        }
    }, [day]);

    const gregorianDate = React.useMemo(() => {
        if (day && day.gregorian) {
            const {
                gregorian: { date, month, year },
            } = day;
            return `${date.toString()} ${DateUtil.getMonthName(month)} ${year.toString()} AD`;
        }
    }, [day]);

    return (
        <div className="day-modal" id={modalId}>
            <input className="modal-state" id="modal-checkbox" type="checkbox" />
            <div className="modal-window">
                <div className="modal-inner">
                    <label className="modal-close" htmlFor="modal-checkbox"></label>
                    <h3>{hijriDate}</h3>
                    <h4>{gregorianDate}</h4>
                    <MiqaatList miqaats={miqaats} day={day} />
                    {additionalContent(day)}
                </div>
            </div>
        </div>
    );
});
