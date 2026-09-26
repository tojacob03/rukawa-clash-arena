// Opened from an invitation link: #/einladung/f-CODE (friendship),
// c-CODE (crew) or g-CODE (gym). Nothing happens without a tap.

import { useState } from "react";
import type { ArcData, ArcState } from "../core/types.ts";
import { cleanText, parseInvite } from "../core/social.ts";
import { go } from "../store.ts";
import { SocialGate } from "../components/Social.tsx";
import { useAct } from "../useAct.tsx";
import { SecTitle } from "../components/ui.tsx";

const TEXT = {
  f: { title: "Jemand will mit dir segeln", lede: "Eine Anfrage für deinen Freundeskreis. Befreundet seht ihr eure Schiffe auf der Seekarte, eure Gurte und wer diese Woche schon trainiert hat.", button: "Anfrage schicken" },
  c: { title: "Eine Einladung in eine Crew", lede: "Eine Crew segelt zusammen: ihr seht eure Schiffe auf der Seekarte und schafft euer Wochenziel gemeinsam.", button: "An Bord gehen" },
  g: { title: "Eine Einladung in ein Gym", lede: "Im Gym siehst du, wer von dort auch Waza Arc nutzt und wer heute auf der Matte steht.", button: "Dem Gym beitreten" },
};

export default function Einladung({ data, st, today, arg }: { data: ArcData; st: ArcState; today: string; arg: string | null }) {
  const inv = parseInvite(arg);
  const act = useAct();
  const [done, setDone] = useState(false);
  if (!inv)
    return (
      <div className="page invite-page">
        <SecTitle h1 kanji="招" eyebrow="Einladung" title="Dieser Link ist unvollständig" />
        <p className="lede">Frag nach einem neuen Link oder gib den Code direkt ein.</p>
        <button type="button" className="btn" onClick={() => go("meer", "crew")}>
          Zur Crew
        </button>
      </div>
    );
  const t = TEXT[inv.kind];
  const next = inv.kind === "g" ? () => go("gym") : () => go("meer", "crew");
  return (
    <div className="page invite-page">
      <SecTitle h1 kanji="招" eyebrow="Einladung" title={t.title}>
        {t.lede}
      </SecTitle>
      <SocialGate data={data} st={st} today={today} back={{ route: "einladung", arg: arg ?? undefined }} intro={t.lede}>
        {(s) => {
          const already = inv.kind === "c" ? s.crew?.code === inv.code : inv.kind === "g" ? s.gym?.code === inv.code : s.me?.code === inv.code;
          const busyElsewhere = inv.kind === "c" && s.crew && s.crew.code !== inv.code;
          return (
            <div className="panel invite-card">
              <p className="small muted">Code</p>
              <p className="code-big" translate="no">
                {inv.code}
              </p>
              {inv.kind === "f" && already ? <p>Das ist dein eigener Code. Schick den Link an andere weiter.</p> : null}
              {inv.kind !== "f" && already ? <p>Da bist du schon dabei.</p> : null}
              {busyElsewhere ? <p className="small">Du bist schon in der Crew {s.crew!.name}. Wenn du wechseln willst, verlass sie zuerst im Crew-Bereich.</p> : null}
              {inv.kind === "g" && s.gym && !already ? <p className="small">Du bist gerade im Gym {s.gym.name}. Mit dem Beitritt wechselst du.</p> : null}
              <div className="row wrap">
                {!already && !busyElsewhere && !done ? (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={act.busy}
                    onClick={() =>
                      void act
                        .run(
                          (m) => (inv.kind === "f" ? m.friendAdd(inv.code) : inv.kind === "c" ? m.crewJoin(inv.code) : m.gymJoin(inv.code)),
                          (r) =>
                            inv.kind === "f"
                              ? r === "accepted" || r === "friends"
                                ? "Ihr seid jetzt befreundet."
                                : "Anfrage verschickt. Sobald sie angenommen ist, seht ihr eure Schiffe auf der Seekarte."
                              : inv.kind === "c"
                                ? `Willkommen an Bord der ${cleanText(r, 40)}.`
                                : `Du bist jetzt im Gym ${cleanText(r, 60)}.`,
                        )
                        .then((ok) => ok && setDone(true))
                    }
                  >
                    {t.button}
                  </button>
                ) : null}
                <button type="button" className={`btn${done || already ? " primary" : " ghost"}`} onClick={next}>
                  {inv.kind === "g" ? "Zum Gym" : "Zur Crew"}
                </button>
              </div>
              {act.msg}
            </div>
          );
        }}
      </SocialGate>
    </div>
  );
}
