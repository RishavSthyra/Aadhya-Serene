import React from 'react';
import Link from 'next/link';
import styles from '../../app/contact/contact.module.css';

// Icons
const FacebookIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg>
);
const InstagramIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>
);
const YouTubeIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path></svg>
);
const LinkedInIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path></svg>
);
const XIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>
);

export default function Contact() {
    return (
        <main className={styles.contactUs}>
            <div className={styles.contactUsWrapper}>
                <form className={styles.contactUsForm}>
                    <h1>Register your interest</h1>
                    <p>Fill out the form</p>

                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Name*</label>
                        <input id="name" name="name" placeholder="Name" required className={styles.input} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="phone">Phone Number*</label>
                        <input id="phone" name="phone" placeholder="+91" type="tel" required className={styles.input} />
                        {/* Note: A full phone number input with country code picker would typically use a library like react-phone-input-2 */}
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email*</label>
                        <input id="email" name="email" type="email" placeholder="@" required className={styles.input} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="requestType">Request Type*</label>
                        <select id="requestType" name="requestType" required className={styles.select} defaultValue="">
                            <option value="" disabled>Select</option>
                            <option value="register_interest">Register Interest</option>
                            <option value="book_unit">Book a Unit</option>
                            <option value="site_visit">Site Visit</option>
                        </select>
                    </div>

                    <button type="submit" className={styles.submitButton}>Send the form</button>

                    <div className={styles.disclaimer}>
                        <p>By submitting this form, you agree that your data will be sent to Abhigna Constructions company and read by our team.</p>
                    </div>
                </form>

                <footer className={styles.contactFooter}>
                    <div className={styles.footerMainRow}>
                        <div className={styles.footerInfoColumn}>
                            <nav className={styles.footerNav} aria-label="Aadhya Serene footer navigation">
                                <Link href="/" className={styles.footerNavLink}>Home</Link>
                                <Link href="/about" className={styles.footerNavLink}>About</Link>
                                <Link href="/apartments" className={styles.footerNavLink}>Apartments</Link>
                                <Link href="/amenities" className={styles.footerNavLink}>Amenities</Link>
                                <Link href="/location" className={styles.footerNavLink}>Location</Link>
                                <Link href="/contact" className={styles.footerNavLink}>Contact</Link>
                            </nav>

                            <span className={styles.footerCopy}>© 2026 Aadhya Serene. All rights reserved.</span>

                            <div className={styles.footerSocial}>
                                <a href="https://www.facebook.com/people/Aadhya-Serene/61584555298768/" className={styles.socialIcon} aria-label="Facebook"><FacebookIcon /></a>
                                <a href="https://www.instagram.com/aadhyaserene.apartments/" className={styles.socialIcon} aria-label="Instagram"><InstagramIcon /></a>
                                <a href="https://www.youtube.com/@Aadhyaserene" className={styles.socialIcon} aria-label="YouTube"><YouTubeIcon /></a>
                                <a href="https://www.linkedin.com/in/aadhya-serene-21186639b" className={styles.socialIcon} aria-label="LinkedIn"><LinkedInIcon /></a>
                                <a href="https://x.com/Abhignaconstruc" className={styles.socialIcon} aria-label="Twitter"><XIcon /></a>
                            </div>

                            <div className={styles.footerContactRow}>
                                <a href="tel:+919620993333" className={styles.footerLink}>+91 96209 93333</a>
                                <a href="mailto:sales@abhignaconstructions.com" className={styles.footerLink}>sales@abhignaconstructions.com</a>
                            </div>

                            <div className={styles.footerReraRow}>
                                <span>RERA No. : PRM / KA / RERA / 1251 / 446 / PR / 190614 / 002604</span>
                            </div>
                        </div>

                        <div className={styles.footerPoweredBy}>
                            <a href="https://sthyra.com" target="_blank" rel="noreferrer">
                                <img
                                    src="https://aadhya-serene-assets-v2.s3.amazonaws.com/sthyra.png"
                                    alt="Sthyra Logo"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}
