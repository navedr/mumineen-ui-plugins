import * as React from "react";
import { MiqaatList } from "./MiqaatList";
import { MiqaatMonth } from "./HijriCalender.interface";
import { Day } from "./libs/HijriCalendar";
import { getGregorianDate, getHijriDate } from "./utils";

export const Modal: React.FC<{
    day: Day;
    modalId: string;
    miqaats?: MiqaatMonth[];
    additionalContent?: (day: Day) => React.ReactNode;
}> = React.memo(({ day, modalId, miqaats, additionalContent }) => (
    <div className="day-modal" id={modalId}>
        <input className="modal-state" id="modal-checkbox" type="checkbox" />
        <div className="modal-window">
            <div className="modal-inner">
                <label className="modal-close" htmlFor="modal-checkbox"></label>
                <h3>{getHijriDate(day)}</h3>
                <h4>{getGregorianDate(day)}</h4>
                <MiqaatList miqaats={miqaats} day={day} />
                {additionalContent?.(day)}
            </div>
        </div>
    </div>
));
