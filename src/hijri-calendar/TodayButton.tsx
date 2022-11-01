import * as React from "react";

export const TodayButton: React.FC<{ onClick: () => void }> = React.memo(({ onClick }) => (
    <div className="today-button">
        <button onClick={onClick}>Today</button>
    </div>
));
