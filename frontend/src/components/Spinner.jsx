import React from 'react';

const Spinner = ({ size = 'medium', color = 'text-blue-500' }) => {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };
    
    return (
        <div className={lex justify-center items-center}>
            <div className={nimate-spin rounded-full border-b-2 border-current  }></div>
        </div>
    );
};

export default Spinner;
