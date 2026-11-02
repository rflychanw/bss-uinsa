"use client";

import { useEffect, useRef, useState } from "react";

const IG = "https://www.instagram.com/bss_uinsa/";

const LINKS = [
  { id: "cara", label: "Cara kerja" },
  { id: "hitung", label: "Harga" },
  { id: "program", label: "Program" },
  { id: "kunjungi", label: "Kunjungi" },
  { id: "tanya", label: "Tanya jawab" },
];

const DESKTOP = LINKS;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState("");
  const burger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /* sticky state + which section is in view */
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setStuck(window.scrollY > 8);
      const line = window.scrollY + 150;
      let current = "";
      for (const l of LINKS) {
        const el = document.getElementById(l.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= line) current = l.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* lock the page, close on Escape, close when growing past the breakpoint */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burger.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 940) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const first = panel.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`hdr${stuck ? " is-stuck" : ""}`}>
        <div className="wrap hdr__in">
          <a className="brand" href="#top">
            <img
              src="/logo-96.png"
              alt="Logo Bank Sampah Syariah UINSA"
              width={36}
              height={36}
            />
            <span className="brand__name">
              Bank Sampah Syariah <em>UINSA</em>
            </span>
          </a>

          <nav className="hdr__nav" aria-label="Bagian halaman">
            {DESKTOP.map((l) => (
              <a key={l.id} href={`#${l.id}`} data-active={active === l.id}>
                {l.label}
              </a>
            ))}
          </nav>

          <a className="hdr__cta" href="/masuk">
            Masuk
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>

          <button
            ref={burger}
            type="button"
            className="hdr__burger"
            aria-expanded={open}
            aria-controls="menu-ponsel"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        id="menu-ponsel"
        ref={panel}
        className="mnav"
        data-open={open}
        aria-hidden={!open}
      >
        <div className="wrap mnav__top">
          <span className="brand__name">
            Bank Sampah Syariah <em>UINSA</em>
          </span>
          <button
            type="button"
            className="mnav__close"
            onClick={close}
            aria-label="Tutup menu"
          >
            <span />
            <span />
          </button>
        </div>

        <nav className="wrap mnav__links" aria-label="Bagian halaman">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-active={active === l.id}
              onClick={close}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="wrap mnav__foot">
          <a className="mnav__cta" href="/masuk" onClick={close}>
            Masuk ke akun
          </a>
          <a className="mnav__reg" href="/daftar" onClick={close}>
            Belum punya akun? Daftar
          </a>
          <a className="mnav__ig" href={IG} target="_blank" rel="noreferrer">
            Instagram @bss_uinsa
          </a>
          <p>
            Laboratorium FEBI, UIN Sunan Ampel Surabaya.
            <br />
            Jl. Ahmad Yani 117, Surabaya.
          </p>
        </div>
      </div>
    </>
  );
}
