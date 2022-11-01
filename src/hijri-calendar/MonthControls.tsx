import * as React from "react";
import { HijriDate } from "./libs/HijriDate";

export const MonthControls: React.FC<{ month: number; onMonthChange: (monthChange: number) => void }> = React.memo(
    ({ month, onMonthChange }) => (
        <div className="month-controls">
            <a href="#" className="prev" onClick={onMonthChange.bind(null, -1)}>
                <i className="icon-chevron-sign-left" />
            </a>
            <h3>{HijriDate.getMonthName(month)}</h3>
            <a href="#" className="next" onClick={onMonthChange.bind(null, +1)}>
                <i className="icon-chevron-sign-right" />
            </a>
        </div>
    ),
);
