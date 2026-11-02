"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    src: "/img/plastik.jpg",
    alt: "Botol PET bening yang sudah dipadatkan menjadi bal di gudang daur ulang",
    title: "Pilah",
    line: "Botol, gelas, kardus, dan kaleng dipisah per jenis — lalu dipadatkan per jenis, tidak dicampur.",
  },
  {
    src: "/img/setor.jpg",
    alt: "Meja layanan bank sampah dengan karung dan timbangan di dalam ruangan",
    title: "Setor",
    line: "Datang ke sekretariat BSS di FEBI, bawa sampah kering yang sudah bersih, tunjukkan nomor nasabahmu.",
  },
  {
    src: "/img/kardus.jpg",
    alt: "Petugas mengangkat bal kardus yang sudah dipadatkan",
    title: "Timbang",
    line: "Petugas menimbang per jenis di depanmu dan mencatat beratnya di buku tabungan.",
  },
  {
    src: "/img/kaleng.jpg",
    alt: "Kaleng aluminium yang sudah digepengkan dan siap dijual ke pengepul",
    title: "Saldo",
    line: "Berat dikali harga pekan itu, hasilnya masuk saldo. Bisa dicairkan, bisa disedekahkan.",
  },
];

const INTERVAL = 6800;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState<number[]>([0]);
  const [paused, setPaused] = useState(false);
  const region = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);

  const goTo = useCallback((next: number) => {
    const n = (next + SLIDES.length) % SLIDES.length;
    setIndex(n);
    setShown((s) => (s.includes(n) ? s : [...s, n]));
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => {
        const n = (i + 1) % SLIDES.length;
        setShown((s) => (s.includes(n) ? s : [...s, n]));
        return n;
      });
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [paused]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < 40) return;
    goTo(delta < 0 ? index + 1 : index - 1);
  };

  return (
    <div
      className="stage"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="disc"
        ref={region}
        role="region"
        aria-roledescription="carousel"
        aria-label="Empat langkah setoran sampah"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        data-reveal
      >
        {SLIDES.map((s, i) => (
          <figure
            key={s.src}
            className={
              i === index
                ? "disc__slide is-active"
                : shown.includes(i)
                  ? "disc__slide is-shown"
                  : "disc__slide"
            }
            role="group"
            aria-roledescription="slide"
            aria-label={`${s.title}, ${i + 1} dari ${SLIDES.length}`}
            aria-hidden={i !== index}
          >
            <img
              src={s.src}
              alt={s.alt}
              width={1400}
              height={1050}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              draggable={false}
            />
          </figure>
        ))}
      </div>

      <div className="stage__bar">
        <button
          type="button"
          className="arrow arrow--prev"
          aria-label="Slide sebelumnya"
          onClick={() => goTo(index - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <g transform="translate(24,0) scale(-1,1)">
              <path
                d="M4.5 12.5a8 8 0 0 1 13.4-5.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M18.2 3.2v4.4h-4.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </button>
        <button
          type="button"
          className="arrow arrow--next"
          aria-label="Slide berikutnya"
          onClick={() => goTo(index + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4.5 12.5a8 8 0 0 1 13.4-5.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M18.2 3.2v4.4h-4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Tampilkan ${s.title}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      <p className="stage__cap" aria-live="polite">
        <b>{SLIDES[index].title}.</b> {SLIDES[index].line}
      </p>
    </div>
  );
}
