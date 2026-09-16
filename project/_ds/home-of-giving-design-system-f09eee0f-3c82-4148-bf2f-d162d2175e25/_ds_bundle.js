/* @ds-bundle: {"format":4,"namespace":"HomeOfGivingDesignSystem_f09eee","components":[{"name":"CampaignCard","sourcePath":"components/cards/CampaignCard.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"StatCounter","sourcePath":"components/core/StatCounter.jsx"},{"name":"Footer","sourcePath":"components/layout/Footer.jsx"},{"name":"Navbar","sourcePath":"components/layout/Navbar.jsx"}],"sourceHashes":{"components/cards/CampaignCard.jsx":"54050d28414e","components/core/Badge.jsx":"51391341ca98","components/core/Button.jsx":"2b1ca6670cac","components/core/ProgressBar.jsx":"8cf747d6063b","components/core/StatCounter.jsx":"d8bdf59de23c","components/layout/Footer.jsx":"b67a6704fe24","components/layout/Navbar.jsx":"bd4ac148b1a6","ui_kits/website/Homepage.jsx":"067b03aaf174"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HomeOfGivingDesignSystem_f09eee = window.HomeOfGivingDesignSystem_f09eee || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/CampaignCard.jsx
try { (() => {
function CampaignCard({
  image,
  category,
  title,
  raised,
  target,
  percent,
  onDonate
}) {
  return React.createElement('div', {
    style: {
      background: 'var(--color-surface-card)',
      border: '1px solid var(--color-border-card)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      width: '320px',
      transition: 'box-shadow var(--dur-base) var(--ease-standard)'
    },
    onMouseEnter: e => e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)',
    onMouseLeave: e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'
  }, React.createElement('div', {
    style: {
      height: '190px',
      background: `center/cover no-repeat url(${image})`
    }
  }), React.createElement('div', {
    style: {
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, React.createElement('span', {
    style: {
      alignSelf: 'flex-start',
      background: 'var(--color-tint-blue)',
      color: 'var(--color-brand-primary)',
      fontSize: '12px',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding: '6px 12px',
      borderRadius: 'var(--radius-pill)'
    }
  }, category), React.createElement('h3', {
    style: {
      margin: 0,
      fontSize: 'var(--fs-h3)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--color-text-heading)',
      lineHeight: 'var(--lh-heading)'
    }
  }, title), React.createElement('div', null, React.createElement('div', {
    style: {
      fontSize: '12px',
      color: 'var(--color-text-body)',
      marginBottom: '4px'
    }
  }, 'Terkumpul'), React.createElement('div', {
    style: {
      fontSize: '18px',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--color-brand-primary)',
      marginBottom: '10px'
    }
  }, raised), React.createElement('div', {
    style: {
      height: '8px',
      borderRadius: '999px',
      background: 'var(--color-tint-blue)',
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    style: {
      height: '100%',
      width: percent + '%',
      background: 'var(--color-brand-accent)',
      borderRadius: '999px'
    }
  })), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
      fontSize: '13px',
      color: 'var(--color-text-body)'
    }
  }, React.createElement('span', {
    style: {
      color: 'var(--color-brand-accent)',
      fontWeight: 'var(--fw-bold)'
    }
  }, percent + '%'), React.createElement('span', null, 'Target ' + target))), React.createElement('button', {
    onClick: onDonate,
    style: {
      marginTop: '4px',
      background: 'var(--color-brand-accent)',
      color: '#fff',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      padding: '12px',
      fontWeight: 'var(--fw-bold)',
      fontSize: '15px',
      cursor: 'pointer'
    }
  }, 'Donasi Sekarang')));
}
Object.assign(__ds_scope, { CampaignCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CampaignCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function Badge({
  tone = 'blue',
  children
}) {
  const map = {
    blue: {
      background: 'var(--color-tint-blue)',
      color: 'var(--color-brand-primary)'
    },
    red: {
      background: 'var(--color-tint-red)',
      color: 'var(--color-brand-accent)'
    }
  };
  const style = {
    ...map[tone],
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-semibold)',
    fontSize: '12px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '6px 12px',
    borderRadius: 'var(--radius-pill)'
  };
  return React.createElement('span', {
    style
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const base = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--fw-bold)',
  fontSize: 'var(--fs-button)',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 'var(--radius-md)',
  padding: '14px 28px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard)'
};
const variants = {
  primary: {
    background: 'var(--color-brand-accent)',
    color: 'var(--color-text-on-brand)',
    boxShadow: 'var(--shadow-button)'
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-brand-primary)',
    border: '1.5px solid var(--color-brand-primary)'
  },
  dark: {
    background: 'var(--color-brand-primary)',
    color: 'var(--color-text-on-brand)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick
}) {
  const sizePad = size === 'sm' ? {
    padding: '10px 20px',
    fontSize: '14px'
  } : size === 'lg' ? {
    padding: '16px 34px',
    fontSize: '17px'
  } : {};
  const style = {
    ...base,
    ...variants[variant],
    ...sizePad,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer'
  };
  return React.createElement('button', {
    style,
    onClick,
    disabled,
    onMouseEnter: e => {
      if (disabled) return;
      e.currentTarget.style.transform = 'translateY(-1px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function ProgressBar({
  percent = 0,
  showLabel = true
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return React.createElement('div', {
    style: {
      width: '100%'
    }
  }, React.createElement('div', {
    style: {
      height: '10px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--color-tint-blue)',
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    style: {
      height: '100%',
      width: pct + '%',
      background: 'var(--color-brand-accent)',
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--dur-base) var(--ease-standard)'
    }
  })), showLabel && React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--color-text-body)'
    }
  }, React.createElement('span', {
    style: {
      fontWeight: 'var(--fw-bold)',
      color: 'var(--color-brand-accent)'
    }
  }, pct + '%'), React.createElement('span', null, 'terkumpul')));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCounter.jsx
try { (() => {
function StatCounter({
  value,
  label,
  tone = 'blue'
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: 'flex-start'
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-extrabold)',
      fontSize: 'var(--fs-stat)',
      lineHeight: 'var(--lh-tight)',
      color: tone === 'red' ? 'var(--color-brand-accent)' : 'var(--color-brand-primary)'
    }
  }, value), React.createElement('div', {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-medium)',
      fontSize: 'var(--fs-body)',
      color: 'var(--color-text-body)'
    }
  }, label));
}
Object.assign(__ds_scope, { StatCounter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCounter.jsx", error: String((e && e.message) || e) }); }

// components/layout/Footer.jsx
try { (() => {
function Footer({
  logoSrc = 'assets/logo.svg'
}) {
  const col = ['Tentang Kami', 'Program', 'Impact', 'Transparansi', 'Berita'];
  return React.createElement('footer', {
    style: {
      background: 'var(--color-brand-navy)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      padding: '56px 40px 28px'
    }
  }, React.createElement('div', {
    style: {
      height: '3px',
      width: '64px',
      background: 'var(--color-brand-accent)',
      borderRadius: '2px',
      marginBottom: '32px'
    }
  }), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '32px'
    }
  }, React.createElement('img', {
    src: logoSrc,
    alt: 'REMAX Home of Giving',
    style: {
      height: '44px',
      filter: 'brightness(0) invert(1)'
    }
  }), React.createElement('div', {
    style: {
      display: 'flex',
      gap: '28px',
      flexWrap: 'wrap'
    }
  }, col.map(l => React.createElement('a', {
    key: l,
    href: '#',
    style: {
      color: '#fff',
      opacity: 0.85,
      fontSize: '14px',
      textDecoration: 'none'
    }
  }, l)))), React.createElement('div', {
    style: {
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid rgba(255,255,255,0.15)',
      fontSize: '13px',
      opacity: 0.7
    }
  }, '© 2026 REMAX Home of Giving. All rights reserved.'));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Footer.jsx", error: String((e && e.message) || e) }); }

// components/layout/Navbar.jsx
try { (() => {
function Navbar({
  active = 'Home',
  logoSrc = 'assets/logo.svg'
}) {
  const links = ['Tentang Kami', 'Program', 'Impact', 'Transparansi', 'Berita'];
  return React.createElement('nav', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 40px',
      background: '#fff',
      borderBottom: '1px solid var(--color-border-card)',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('img', {
    src: logoSrc,
    alt: 'REMAX Home of Giving',
    style: {
      height: '40px'
    }
  }), React.createElement('div', {
    style: {
      display: 'flex',
      gap: '28px',
      alignItems: 'center'
    }
  }, links.map(l => React.createElement('a', {
    key: l,
    href: '#',
    style: {
      color: l === active ? 'var(--color-brand-primary)' : 'var(--color-text-heading)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: '15px',
      textDecoration: 'none'
    }
  }, l))), React.createElement('button', {
    style: {
      background: 'var(--color-brand-accent)',
      color: '#fff',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      padding: '12px 22px',
      fontWeight: 'var(--fw-bold)',
      fontSize: '15px',
      cursor: 'pointer'
    }
  }, 'Donasi Sekarang'));
}
Object.assign(__ds_scope, { Navbar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Navbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Homepage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Navbar,
  Footer,
  Button,
  Badge,
  StatCounter,
  CampaignCard
} = window.HomeOfGivingDesignSystem_f09eee;
const campaigns = [{
  image: '../../assets/photos/community-01.jpg',
  category: 'Pendidikan',
  title: 'Bantu Anak Indonesia Tetap Sekolah',
  raised: 'Rp75.000.000',
  target: 'Rp100.000.000',
  percent: 75
}, {
  image: '../../assets/photos/community-02.jpg',
  category: 'Kesehatan',
  title: 'Dukungan Terapi untuk Anak Difabel',
  raised: 'Rp42.500.000',
  target: 'Rp80.000.000',
  percent: 53
}, {
  image: '../../assets/photos/community-03.jpg',
  category: 'Sosial',
  title: 'Kegiatan Kreatif Bersama Komunitas',
  raised: 'Rp18.900.000',
  target: 'Rp30.000.000',
  percent: 63
}];
function Homepage() {
  const [donateOpen, setDonateOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Navbar, {
    active: "Home",
    logoSrc: "../../assets/logo.svg"
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      padding: '90px 40px 100px',
      background: 'var(--color-bg-soft)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 34,
      color: 'var(--color-brand-accent)'
    }
  }, "Together, we make a difference"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontWeight: 800,
      fontSize: 'clamp(38px,5vw,64px)',
      lineHeight: 1.05,
      color: 'var(--color-text-heading)',
      margin: '8px 0 20px',
      textTransform: 'uppercase'
    }
  }, "Giving Starts", /*#__PURE__*/React.createElement("br", null), "From Home."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'var(--color-text-body)',
      maxWidth: 440,
      lineHeight: 1.6,
      marginBottom: 28
    }
  }, "Bersama REMAX Home of Giving, kami menghadirkan bantuan pendidikan, kesehatan, dan kegiatan sosial bagi anak-anak dan keluarga yang membutuhkan di seluruh Indonesia."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => setDonateOpen(true)
  }, "Donasi Sekarang \u2192"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Lihat Program"))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 24,
      overflow: 'hidden',
      height: 420,
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photos/community-01.jpg",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '56px 40px',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(StatCounter, {
    value: "12.500+",
    label: "Penerima Manfaat"
  }), /*#__PURE__*/React.createElement(StatCounter, {
    value: "47",
    label: "Program Sosial",
    tone: "red"
  }), /*#__PURE__*/React.createElement(StatCounter, {
    value: "Rp2,4 M",
    label: "Donasi Tersalurkan"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 40px',
      background: 'var(--color-bg-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 32,
      color: 'var(--color-brand-accent)'
    }
  }, "Program & Target Donasi"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontWeight: 700,
      fontSize: 36,
      color: 'var(--color-text-heading)',
      margin: '6px 0 0',
      textTransform: 'uppercase'
    }
  }, "Bersama Mencapai Target Kebaikan")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 28,
      justifyItems: 'center'
    }
  }, campaigns.map(c => /*#__PURE__*/React.createElement(CampaignCard, _extends({
    key: c.title
  }, c)))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '90px 40px',
      background: 'var(--color-brand-primary)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 24,
      overflow: 'hidden',
      height: 340
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/photos/community-02.jpg",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    tone: "red"
  }, "Our Impact"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontWeight: 800,
      fontSize: 34,
      margin: '14px 0 16px'
    }
  }, "Setiap Donasi Menciptakan Perubahan Nyata"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      opacity: 0.9,
      lineHeight: 1.6,
      marginBottom: 24
    }
  }, "Dari bantuan pendidikan hingga fasilitas kesehatan, kami memastikan setiap rupiah donasi tersalurkan tepat sasaran dan transparan."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(StatCounter, {
    value: "120+",
    label: "Titik Distribusi"
  }), /*#__PURE__*/React.createElement(StatCounter, {
    value: "98%",
    label: "Tingkat Transparansi",
    tone: "red"
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 40px',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 900,
      margin: '0 auto',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-hand)',
      fontWeight: 700,
      fontSize: 32,
      color: 'var(--color-brand-primary)'
    }
  }, "Cerita Kebaikan"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontWeight: 700,
      fontSize: 32,
      color: 'var(--color-text-heading)',
      margin: '6px 0 32px'
    }
  }, "Stories of Giving"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-bg-soft)',
      borderRadius: 20,
      padding: '40px',
      border: '1px solid var(--color-border-card)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      color: 'var(--color-text-heading)',
      lineHeight: 1.6,
      fontStyle: 'italic',
      marginBottom: 16
    }
  }, "\"Bantuan kursi roda dan pendampingan dari relawan Home of Giving membuat anak saya bisa kembali bermain dan belajar dengan gembira.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      color: 'var(--color-brand-primary)'
    }
  }, "Ibu Sari, Orang Tua Penerima Manfaat")))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 40px',
      background: 'var(--color-bg-soft)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontWeight: 800,
      fontSize: 36,
      color: 'var(--color-text-heading)',
      margin: 0,
      textTransform: 'uppercase'
    }
  }, "Satu Donasi.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-brand-accent)'
    }
  }, "Banyak Harapan.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: () => setDonateOpen(true)
  }, "Donasi Sekarang"))), /*#__PURE__*/React.createElement(Footer, {
    logoSrc: "../../assets/logo.svg"
  }), donateOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setDonateOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(6,46,97,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: '#fff',
      borderRadius: 20,
      padding: 36,
      width: 360,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 8px',
      color: 'var(--color-text-heading)',
      fontWeight: 700
    }
  }, "Terima kasih!"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--color-text-body)',
      fontSize: 15,
      marginBottom: 20
    }
  }, "Ini adalah prototipe \u2014 alur donasi sungguhan akan muncul di sini."), /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    onClick: () => setDonateOpen(false)
  }, "Tutup"))));
}
window.Homepage = Homepage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Homepage.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CampaignCard = __ds_scope.CampaignCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatCounter = __ds_scope.StatCounter;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Navbar = __ds_scope.Navbar;

})();
