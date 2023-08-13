import * as React from "react";
import { MiqaatMonth } from "./HijriCalender.interface";
import { Day } from "./libs/HijriCalendar";

export interface ICalendarContext {
    miqaats?: MiqaatMonth[];
}

export const CalendarContext = React.createContext<ICalendarContext>({});
export const useCalendarContext: () => ICalendarContext = () => React.useContext(CalendarContext);
