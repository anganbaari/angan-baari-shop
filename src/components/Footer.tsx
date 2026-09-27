// Ported verbatim from reference/shop.html's <footer class="site-footer">
// (identical across every app page). Real class names from site.css so the
// ported CSS applies as-is — see FOOTER / APP-PAGE FOOTER in style.css.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-icon">
            <img
              src="https://ik.imagekit.io/anganbaari/angan-baari/site-images/logo-icon_0PorSdbpKy.png"
              alt="Angan Baari"
              width={56}
              height={56}
              loading="lazy"
            />
          </span>
          <p className="footer-name-np">आँगन बारी</p>
          <p className="footer-name-en">Angan Baari</p>
          <p className="footer-tagline">Fresh &middot; Organic &middot; Sustainable</p>
        </div>

        <div className="footer-social">
          <a
            href="https://www.facebook.com/anganbaari/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="fb"
          >
            <i className="fab fa-facebook-f" />
          </a>
          <a
            href="https://www.instagram.com/anganbaari/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="ig"
          >
            <i className="fab fa-instagram" />
          </a>
          <a
            href="https://www.youtube.com/@AnganBaari"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="yt"
          >
            <i className="fab fa-youtube" />
          </a>
          <a
            href="https://x.com/anganbaari"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="x"
          >
            <i className="fab fa-x-twitter" />
          </a>
          <a
            href="https://www.tiktok.com/@anganbaari"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="tiktok"
          >
            <i className="fab fa-tiktok" />
          </a>
          <a
            href="https://www.threads.com/@anganbaari"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Threads"
            className="threads"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 192 192"
              fill="currentColor"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 6.995 4.708 16.008 7.005 25.403 6.493 12.38-.68 22.081-5.407 28.819-14.041 5.129-6.675 8.374-15.311 9.678-25.396 5.808 3.506 10.1 8.12 12.509 13.677 4.956 11.421 5.253 30.18-10.25 45.625-13.616 13.56-29.976 19.425-54.73 19.594-27.456-.19-48.24-9.02-61.777-26.24C9.52 140.88 3.114 121.88 2.857 97.024c.257-24.854 6.663-43.854 19.053-56.494C35.447 23.27 56.23 14.44 83.687 14.25c27.635.19 48.728 9.064 62.722 26.37 6.868 8.561 12.007 19.324 15.368 32.012l16.108-4.278c-4.027-14.927-10.305-27.739-18.745-38.146C141.329 10.804 116.55-.067 83.69.001 50.795.068 25.752 11.01 9.884 32.609-4.05 51.73-11.04 78.173-11.333 97.024v.192c.293 18.85 7.283 45.295 21.217 64.416C26.752 182.99 51.795 193.932 84.69 194c34.057-.083 57.805-10.67 74.473-27.252 22.02-21.956 21.463-49.435 14.18-66.327-5.177-11.944-14.8-21.437-31.806-27.433Z" />
            </svg>
          </a>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; Since 2015. आँगन बारी/Angan Baari &mdash; Bhulka Danda, Rupandehi, Nepal &mdash;
            All rights reserved.
          </p>
          <p className="footer-nepal">
            {" "}
            JAY NEPAL
            <img
              className="flag-sticker"
              src="https://upload.wikimedia.org/wikipedia/commons/9/9b/Flag_of_Nepal.svg"
              alt="Nepal National Flag"
              width={18}
              height={24}
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
