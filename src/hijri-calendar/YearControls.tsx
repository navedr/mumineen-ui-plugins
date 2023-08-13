import * as React from "react";
import { preventDefault } from "./utils";

export const YearControls: React.FC<{ year: number; onYearChange: (yearChange: number) => void }> = React.memo(
    ({ year, onYearChange }) => (
        <div className="year-controls">
            <a href="#" onClick={preventDefault(onYearChange.bind(null, -1))}>
                <i className="icon-minus-sign" />
            </a>
            <h2>{year}H</h2>
            <a href="#" onClick={preventDefault(onYearChange.bind(null, +1))}>
                <i className="icon-plus-sign" />
            </a>
        </div>
    ),
);
