import React from "react";
import "./HallOfLegendsLive.css";

export default function HallOfLegendsLive() {
  return (
    <section className="ags-hall">
      <img
        className="ags-hall-bg"
        src="/assets/scenes/scene_hall_of_legends_stage_lit.png"
        alt="Hall of Legends"
      />

      <div className="ags-portal">
        <div className="ags-portal-ring ags-ring-one" />
        <div className="ags-portal-ring ags-ring-two" />
        <div className="ags-portal-core" />
      </div>

      <div className="ags-energy-particles">
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} style={{
            left: `${8 + Math.random() * 84}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${4 + Math.random() * 5}s`
          }} />
        ))}
      </div>

      <div className="ags-guitar-stage">
        <img
          className="ags-spinning-guitar"
          src="/assets/guitars/guitar_frankenbolt.png"
          alt="Franknbolt guitar"
        />
        <div className="ags-guitar-glow" />
      </div>

      <div className="ags-spotlight ags-spotlight-left" />
      <div className="ags-spotlight ags-spotlight-right" />

      <div className="ags-ui-panel">
        <strong>Unlocked:</strong> Franknbolt
        <span>Hall of Legends reward</span>
      </div>
    </section>
  );
}
