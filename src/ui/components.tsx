import React from "react";

export function ChevronLeft({ ...props }) {
    return (
        <div {...props} aria-label="Previous Month">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-left"
            >
                <path d="m15 18-6-6 6-6" />
            </svg>
        </div>
    );
}

export function ChevronRight({ ...props }) {
    return (
        <div {...props} aria-label="Next Month">
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-right"
            >
                <path d="m9 18 6-6-6-6" />
            </svg>
        </div>
    );
}

export function Dot({ ...props }) {
    return (
        <div {...props} aria-label="Today">
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-dot"
            >
                <circle cx="12.1" cy="12.1" r="1" />
            </svg>
        </div>
    );
}
