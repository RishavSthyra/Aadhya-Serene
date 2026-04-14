import React from 'react';
import { IoIosArrowBack, IoIosArrowDown, IoIosArrowForward, IoIosArrowUp } from 'react-icons/io';
import styles from '../../app/walkthrough/walkthrough.module.css';

export default function Controls({ targets, onMove }) {
    return (
        <div className={styles.controls}>
            <button
                className={`${styles.btn} ${styles.forward}`}
                onClick={() => onMove('forward')}
                disabled={!targets.forward}
                aria-label="Move Forward"
            >
                <IoIosArrowUp className={styles.icon} />
            </button>
            <button
                className={`${styles.btn} ${styles.left}`}
                onClick={() => onMove('left')}
                disabled={!targets.left}
                aria-label="Move Left"
            >
                <IoIosArrowBack className={styles.icon} />
            </button>
            <button
                className={`${styles.btn} ${styles.back}`}
                onClick={() => onMove('back')}
                disabled={!targets.back}
                aria-label="Move Back"
            >
                <IoIosArrowDown className={styles.icon} />
            </button>
            <button
                className={`${styles.btn} ${styles.right}`}
                onClick={() => onMove('right')}
                disabled={!targets.right}
                aria-label="Move Right"
            >
                <IoIosArrowForward className={styles.icon} />
            </button>
        </div>
    );
}
