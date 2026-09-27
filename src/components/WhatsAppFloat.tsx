// The .float-wa CSS lives in the global site.css (Phase 0) since it's a
// simple, always-identical floating button — but the button only appears on
// pages that render it (shop + product detail in the reference site, not
// every page), so it's a small page-level component rather than part of the
// frozen shared shell.
export default function WhatsAppFloat({ message }: { message: string }) {
  return (
    <a
      href={`https://wa.me/9779821025084?text=${encodeURIComponent(message)}`}
      className="float-wa"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Order via WhatsApp"
    >
      <i className="fab fa-whatsapp" />
      <span className="float-wa-tooltip">Order via WhatsApp</span>
    </a>
  );
}
