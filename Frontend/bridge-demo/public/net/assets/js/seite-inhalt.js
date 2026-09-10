/* ==========================================================================
   matten.net — Inhaltsseiten (Blog, Gaestebuch, Infoseiten)
   --------------------------------------------------------------------------
   Eine Datei fuer drei Seiten. Was nicht im Dokument steht, wird
   uebersprungen.

     seite.html?s=<slug>   Infoseiten. Die Texte stammen wortgetreu aus der
                           Erfassung von matten.net (spec/texte/*.md) und
                           sind hier eingebettet — es wird nichts von
                           matten.de oder matten.net nachgeladen.
     blog.html             Die zwei Beitraege der Vorlage.
     gaestebuch.html       Die Vorlage rendert dort nichts. Statt eine
                           Funktion vorzutaeuschen, steht hier eine saubere
                           Leeransicht.

   Zu den Rechtstexten: sie sind uebernommene Platzhalter. Sie tragen darum
   auf jeder Seite einen deutlich sichtbaren Hinweis, dass sie vor einem
   echten Betrieb rechtlich geprueft werden muessen.

   Der Slug wird aus ?s= gelesen; die aeltere Schreibweise ?seite= wird
   ebenfalls angenommen, weil die Navigation sie noch verwendet.
   ========================================================================== */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ======================================================================
     Die Texte
     ====================================================================== */

  var SEITEN = {
    "agb": {
      "titel": "AGB",
      "rubrik": "Rechtliches",
      "kurz": "Allgemeine Geschäftsbedingungen der FUCHSIUS multi-media GmbH.",
      "rechtstext": true,
      "quelle": "matten.net/de/pages/agb, erfasst am 31.08.2026",
      "abschnitte": [
        {
          "id": "a1",
          "titel": null,
          "html": "<p><strong>Allgemeine Geschäftsbedingungen der FUCHSIUS multi-media GmbH</strong> (AGB-Download)</p>"
        },
        {
          "id": "a2-i-allgemeines-bestandteil-unserer-agb-ist-unsere",
          "titel": "I. Allgemeines - Bestandteil unserer AGB ist unsere",
          "html": ""
        },
        {
          "id": "a3-datenschutzerklaerung-nach-eu-datenschutzverordn",
          "titel": "Datenschutzerklärung nach EU-Datenschutzverordnung (DSGVO)",
          "html": "<p>1. Nachstehende Geschäftsbedingungen sind Vertragsbestandteile für alle gegenwärtigen und zukünftigen Lieferverträge, sofern sie nicht im Vertrag ausdrücklich abgeändert oder ausgeschlossen werden; frühere etwa anders lautende Bedingungen verlieren hiermit ihre Gültigkeit.</p>\n<p>2. Abweichende Bedingungen des Bestellers verpflichten den Lieferer nicht, auch wenn er ihnen nicht ausdrücklich widerspricht. Durch Erteilung von Aufträgen erkennt der Besteller diese Lieferungsbedingungen als rechtsverbindlich an.</p>\n<p>3. Der Vertrag bleibt auch bei rechtlichem Unwirksamwerden einzelner Punkte seiner Bedingungen in den restlichen Punkten verbindlich.</p>\n<p>4. Speziell angefertigte und/oder zugeschnittene Produkte sind grundsätzlich vom Umtausch ausgeschlossen.</p>"
        },
        {
          "id": "a4-ii-umfang-der-lieferpflicht",
          "titel": "II. Umfang der Lieferpflicht",
          "html": "<p>1. Der Umfang der Bestellung ergibt sich aus dem Angebot und/oder der schriftlichen Auftragsbestätigung des Lieferers. Bei mündlicher, telefonischer oder eMail-Bestellung ist die schriftliche Auftragsbestätigung des Lieferers maßgebend. Bis zur schriftlichen Auftragsbestätigung sind die Angebote freibleibend; Zwischenverkauf bleibt vorbehalten. Nebenabreden bedürfen der schriftlichen Bestätigung. Zuschneiden gehört nicht zum Lieferumfang, sofern nicht besonders bestätigt.</p>\n<p>2. Die zu dem Angebot gehörenden Unterlagen, z. B. Maße, sind nur annähernd maßgebend, soweit sie nicht ausdrücklich als verbindlich bezeichnet sind. Der Lieferer behält sich technische Änderungen während der Lieferzeit vor, soweit der Kaufgegenstand hinsichtlich Funktion und Aussehen nicht grundsätzlich geändert wird und die Änderung für den Vertragspartner zumutbar ist.</p>\n<p>3. Die in den Prospektunterlagen bzw. in den angefügten Dateien oder in unserer Internetpräsenz abgebildeten Mattenfarben können von den Originalfarben abweichen, da wegen der auf Papier und Textil verschiedenen Lichtreflexion, bzw. unkalibrierten Monitoren, die Farben unterschiedlich erscheinen. Verbindlich können nur die Originalfarbmuster sein.</p>\n<p>4. Unsere Standard-Florbreiten für Matten betragen u.a. ca.82cm, 112cm, 147cm und 197cm als Rohware, d.h. vor dem Vulkanisieren. Matten mit umlaufendem Gummirand werden mit Standard-Ausgangsbreiten von ca. 85cm, 115cm, 150cm und 200cm gefertigt (Maße vor dem Vulkanisieren) Beim Beschichten (Vulkanisieren) und im späteren Gebrauch schrumpfen die Matten erfahrungsgemäß ca.3-5 %</p>\n<p>5. Falls Matten in Rahmen, Windfang, Türstock etc. bündig eingepasst oder passend zu einer abzudeckenden Fläche verlegt werden sollen, benötigen wir die genauen Rahmen-Innenmaße, bzw. die Maße der abzudeckenden Fläche. Gem.Pkt.4 notwendige Schrumpfungs-Zuschläge bis zu einer maximalen Breite von 200cm mit Rand, bzw.197cm ohne Rand (Maß vor dem Beschichten und Vulkanisieren), werden von uns kalkuliert und individuell angeboten. Die Matten werden auf Wunsch mit Übermaß produziert, vor Auslieferung mehrfach vorgewaschen und zwischen-getrocknet. Die Matten werden dann mit Übermaß, gegebenenfalls ohne umlaufenden Rand geliefert und müssen bauseits vor Ort eingeschnitten werden.</p>\n<p>6. Unsere Matten werden, falls nichts anderes vereinbart ist, in rechtwinkliger Form mit oder ohne Rand geliefert. Nichtrechtwinklige Matten (Freesize-Ausführung) können ebenfalls mit oder ohne umlaufenden Gummirand gefertigt werden. Dazu benötigen wir genaue Vorlagen mit den entsprechenden Maßangaben. Da der individuelle Zuschnitt nicht maschinell erfolgen kann, muss der höhere zeitliche Aufwand für den manuellen Zuschnitt zusätzlich kalkuliert werden. Dieses ist von der Form und Art des Zuschnittes abhängig. Wir benötigen die Einzelheiten zu dem gewünschten Zuschnitt mit genauen Maßangaben, möglichst mit einer Skizze.</p>\n<p>7. An Kostenanschlägen, Zeichnungen und anderen Unterlagen des Angebotes behält sich der Lieferer Eigentums- und Urheberrecht vor; sie dürfen Dritten nicht zugänglich gemacht werden. Sie sind dem Lieferer, wenn der Auftrag nicht erteilt wird, auf Verlangen unverzüglich zurück zu geben.</p>\n<p>8. Teillieferungen sind zulässig.</p>\n<p>9. Der Abnehmer bestätigt durch diese Auftragserteilung, dass die bestellten Marken- oder Firmenzeichen sowie Schriftzüge verwendet werden dürfen.</p>"
        },
        {
          "id": "a5-iii-preise-und-zahlungsbedingungen",
          "titel": "III. Preise und Zahlungsbedingungen",
          "html": "<p>1. Die Preise gelten ab Betrieb oder Niederlassung des Lieferers ausschließlich Verpackung und Fracht. Diese werden extra berechnet, falls im Angebot oder in der Auftragsbestätigung es nicht ausdrücklich anders vereinbart wurde.</p>\n<p>2. Die Verpackung wird nicht zurückgenommen, es sei denn, es handelt sich um Anlieferung auf Palette, falls die Eigentum des Lieferers sind.</p>\n<p>3. Treten nach Ablauf von drei Monaten nach Vertragsabschluss Materialpreis- oder Lohn- und Gehaltserhöhungen ein oder werden Steuern und Abgaben erhöht, so ist der Lieferer berechtigt, seine Preise entsprechend anzugleichen. Anzahlungen und Vorausleistungen sind ohne Einfluss auf die Preise. Sie werden gutgeschrieben und auf den sich endgültig ergebenden Preis verrechnet.</p>\n<p>4. Erstlieferungen und Aufträge unter 350,00 € Warenwert können ohne Abzug per Nachnahme berechnet werden, sonst gilt Zahlung netto Kasse sofort nach Rechnungsdatum, sofern nicht mit der Auftragsbestätigung andere Zahlungskonditionen vereinbart wurden.</p>\n<p>Der Lieferer behält sich vor, bei Aufträgen von 3.000,00 € und höher ein Drittel der Auftragssumme nach Erhalt der Auftragsbestätigung, ein Drittel nach Anzeige der Versandbereitschaft und den Rest nach erfolgter Lieferung in bar anzufordern. Verzögert sich die Auslieferung aus Gründen, die der Lieferer nicht zu vertreten hat, so kann der Lieferer auch bei Aufträgen bis zu 3.000,00 € zwei Drittel der Vertragssumme als Anzahlung verlangen.</p>\n<p>Die Annahme von Schecks und Wechseln erfolgt nur zahlungshalber und ohne Gewähr für Protest. Die Kosten für Diskontierung und Einziehen gehen zu Lasten des Bestellers. Im Falle des Verzuges ist der Lieferer berechtigt, Zinsen in Höhe der für Kreditanspruchnahme banküblichen Sätze zu berechnen.</p>\n<p>5. Werden nach Vertragsabschluss Umstände bekannt, die geeignet sind, die Kreditwürdigkeit des Bestellers zu mindern, so werden sämtliche Forderungen ohne Rücksicht auf die Laufzeit etwa hereingenommener Wechsel fällig. Derartige Umstände berechtigten den Lieferer ferner, noch ausstehende Leistungen nur gegen Vorauszahlung oder Sicherheitsleistung auszuführen sowie nach Ablauf einer angemessenen Nachfrist vom Vertrag zurückzutreten oder Schadenersatz wegen Nichterfüllung zu verlangen.</p>"
        },
        {
          "id": "a6-iv-eigentumsvorbehalt",
          "titel": "IV. Eigentumsvorbehalt",
          "html": "<p>l. Alle Lieferungen erfolgen unter Eigentumsvorbehalt. Das Eigentum geht erst dann auf den Besteller über, wenn er seine Verbindlichkeit ten aus den Lieferungen voll getilgt hat. Das gilt auch dann, wenn der Kaufpreis für bestimmte, vom Besteller bezeichnete Warenlieferungen bezahlt ist. Bei laufender Rechnung gilt das vorbehaltende Eigentum als Sicherung für die Saldoforderung des Lieferers.</p>\n<p>2. Der Besteller ist berechtigt, die gelieferte Ware im gewöhnlichen Geschäftsverkehr zu seinen normalen Geschäftsbedingungen zu veräußern. Verpfändungen oder Sicherheitsübereignungen sind ihm untersagt.</p>\n<p>3. Von einer Pfändung oder jeder anderen Beeinträchtigung seiner Rechte durch Dritte hat der Besteller den Lieferer unverzüglich zu benachrichtigen. Veräußert der Besteller die gelieferte Ware, so tritt er schon jetzt bis zur völligen Tilgung alle die ihm aus der Veränderung entstehenden Forderungen gegen seine Abnehmer mit allen Nebenrechten an den Lieferer ab. Auf Verlangen des Lieferers ist der Besteller verpflichtet, die Abtretung seinen Abnehmern bekannt zu geben und dem Lieferer die zur Geltendmachung seiner Rechte erforderlichen Auskünfte zu geben.</p>\n<p>4. Die Geltendmachung des Eigentumsvorbehaltes sowie die Pfändung des Liefergegenstandes gelten nicht als Rücktritt vom Vertrag, sofern nicht gesetzlich etwas anderes bestimmt ist.</p>"
        },
        {
          "id": "a7-v-lieferfrist",
          "titel": "V. Lieferfrist",
          "html": "<p>1. Die Lieferfrist rechnet nach erfolgter Auftragsbestätigung erst vom Tage der Klarstellung sämtlicher Einzelheiten des Auftrages an, d.h. nach Eingang aller Unterlagen. Sie ist unverbindlich, aber so bemessen, dass sie bei regelmäßigem Ablauf der Fertigung einbehalten werden kann.</p>\n<p>2. Betriebsstörungen im eigenen Betrieb oder bei Unterlieferern, Fälle höherer Gewalt, Krieg, Aufruhr, Aussperrung, Streik, Brand, Beschlagnahme, Ausschusswerden eines wichtigen Arbeitsstückes, Einschränkung der Energieversorgung sowie der verspätete Eingang wesentlicher Rohstoffe befreien den Lieferer von der Einhaltung der Lieferfristen. Sollte sich die Lieferung durch diese Umstände verzögern oder unmöglich werden und den Lieferer kein Verschulden treffen, so sind Schadenersatzansprüche des Bestellers ausgeschossen Im Falle objektiver Unmöglichkeit haben beide Parteien das Recht, vom Vertrag zurückzutreten.</p>"
        },
        {
          "id": "a8-vl-gefahruebergang-versand-und-ruecksendung-von-",
          "titel": "Vl. Gefahrübergang, Versand und Rücksendung von Waren",
          "html": "<p>1. Der Lieferer versendet stets auf Rechnung und Gefahr des Bestellers, auch bei Franko-Lieferungen. Die Gefahr geht auf den Besteller über, sobald die Sendung das Lager verlassen hat.</p>\n<p>Vom gleichen Zeitpunkt an haftet der Besteller für Schäden, die Dritten gegenüber entstehen können. Ist die Ware versandbereit und verzögert sich die Versendung oder die Annahme aus Gründen, die der Lieferer nicht zu vertreten hat, so geht die Gefahr mit dem Zugang der Anzeige der Versandbereitschaft auf den Besteller über. Der Lieferer ist berechtigt, diese Ware auf Kosten des Bestellers und für dessen Rechnung und Gefahr anderweitig einzulagern, wenn die Abnahmeverpflichtung um länger als 4 Wochen verzögert wird.</p>\n<p>2. Versandweg, Versandart und Versandmittel sind unter Ausschluss der Haftung und ohne Gewähr für billigsten Transport dem Lieferer überlassen.</p>\n<p>3. Rücksendekosten: Käufer trägt die unmittelbaren Kosten der Rücksendung der Waren Rücknahmebedingungen: siehe nachfolgende Angaben:</p>\n<p>Widerrufsrecht für Verbraucher unter Berücksichtigung von §1 Allgeneines, Punkt 4</p>\n<p>(Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die</p>\n<p>überwiegend weder Ihrer gewerblichen noch ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können).</p>\n<p>Sie haben das Recht unter Berücksichtigung von §1 Allgeneines, Punkt 4. binnen 1 Monat ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>\n<p>Die Widerrufsfrist beträgt 1 Monat ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, die</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischertrasse 2</p>\n<p>85737 Ismaning / Deutschland</p>\n<p>Telefon : 089 - 54 55 82 64</p>\n<p>E-Mail: info@matten.net</p>\n<p>mit einer eindeutigen Erklärung über Ihren Entschluss informieren (z.B. durch einen mit der Post versandten Brief oder mittels E-Mail), diesen Vertrag zu widerrufen. Sie können den Widerruf formlos nur in schriftlicher Form, z.B. per eMail oder Briefpost vornehmen.</p>\n<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung Ihres Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>\n<p>Folgen des Widerrufs</p>\n<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>\n<p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>"
        },
        {
          "id": "a9-vll-transportschaeden-und-versicherung",
          "titel": "Vll. Transportschäden und Versicherung",
          "html": "<p>1. Transportschäden müssen beim Empfang der Ware sofort angezeigt werden. Bei Bahntransporten ist von der Güterabfertigung eine bahnamtliche Bescheinigung zur Geltendmachung von Ersatzansprüchen über den Schaden zu verlangen. Diese ist uns umgehend einzusenden. Wird verabsäumt, diese Bescheinigung zu beschaffen, wird jeder Ersatzanspruch abgelehnt.</p>\n<p>2. Die Versicherung der Waren gegen Transportschäden wird nur auf Wunsch des Bestellers vorgenommen. Der Lieferer berechnet in diesem Fall die ihm entstandenen Kosten, übernimmt aber keine Verantwortung für die Durchführung der Versicherurig.</p>"
        },
        {
          "id": "a10-vlll-gewaehrleistungsansprueche",
          "titel": "Vlll. Gewährleistungsansprüche",
          "html": "<p>Offensichtliche Mängel müssen binnen 8 Tagen nach Empfang der Waren schriftlich gerügt werden. Maßabweichungen (auch wie unter II.4 beschrieben) und Farbabweichungen, insbesondere mögliche Farbabweichungen zwischen Anzeige auf Monitoren und Printvorlagen zu den Originalfarben sind unvermeidbar und können nicht beanstandet werden. Verbindlich sind nur unsere Originalfarbmuster, wobei bei Nachdrucken zu vorangegangenen Lieferungen Farbunterschiede von Charge zu Charge möglich sind.</p>\n<p>Zu beachten sind auch bei gleichen Farbnummern mögliche Farbunterschiede bei unterschiedlichen Floor- und Mattenqualitäten. Dieses gilt besonders, wenn verschiedene Mattenqualitäten nebeneinander verlegt werden. Beachten Sie von der Floorrichtung und vom Umgebungslicht abhängige unterschiedliche Farbenwiedergaben.</p>\n<p>Ist die Ware infolge von Material- und/oder Verarbeitungsfehlern mangelhaft oder fehlen ihr zugesicherte Eigenschaften, so ist der Lieferer verpflichtet, sie nach seiner Wahl entweder nachzubessern oder kostenlos durch einwandfreie Ware zu ersetzen. Dem Besteller bleibt das Recht vorbehalten, bei Fehlschlagen der Nachbesserung oder Ersatzlieferung Herabsetzung der Vergütung oder nach seiner Wahl Rückgängigmachung des Vertrages zu verlangen. Dies gilt jedoch nur dann, wenn der Besteller die Ware nicht verändert hat und die Waschvorschriften beachtet hat.</p>\n<p>Weitere Gewährleistungsansprüche des Bestellers sind ausgeschlossen. Eine Haftung ist ausgeschlossen, wenn die Ware sich nicht mehr im Zustand der Ablieferung befindet, d. h. insbesondere, sofern der Besteller die Ware bereits velegt oder benutzt hat und/oder Änderungen oder Instandsetzungsarbeiten veranlasst hat.</p>\n<p>Gewährleistungsansprüche verjähren sechs Monate nach Erhalt der Ware. Schadenersatzansprüche bleiben beschränkt auf den Fall groben Verschuldens oder Vorsatzes.</p>\n<p>1. Erfüllungsort ist der Sitz des Lieferers.</p>\n<p>2. Gerichtsstand ist München. Das gilt auch für Wechsel- und Scheckklagen. Ist der Käufer Gewerbetreibender im Sinne des §4 HGB oder Nichtkaufmann, so wird hiermit ausdrücklich vereinbart, dass Ansprüche im Wege des Mahnverfahrens (§§688 ff ZPO) an dem Gerichtsstand München geltend gemacht werden können (§ 38 Abs. 3 Ziff. 2b ZPO).</p>\n<p>Der Lieferer weist gemäß seiner Datenschutzerklärung gemäß EU-Datenschutzverordnung (DSGVO) darauf hin, dass zur Vertragsabwicklung erforderliche Daten in seiner Datenverarbeitungsanlage gespeichert sind.</p>\n<p>FUCHSIUS multi-media GmbH <em> HRB161064 AG München </em> Geschäftsführer:Dipl.-Ing.Dieter Fuchsius <em> Fischerstrasse 2 </em> D-85737 Ismaning <em> Steuer-Nr.143 13880 428 </em> AGB fmm 01/18</p>"
        }
      ]
    },
    "widerruf": {
      "titel": "Widerrufsbelehrung",
      "rubrik": "Rechtliches",
      "kurz": "Widerrufsrecht für Verbraucher.",
      "rechtstext": true,
      "quelle": "matten.net/de/pages/agb, Abschnitt VI — dort ist die Belehrung in die AGB eingebettet",
      "abschnitte": [
        {
          "id": "a1-widerrufsrecht-fuer-verbraucher",
          "titel": "Widerrufsrecht für Verbraucher",
          "html": "<p>(Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die</p>\n<p>überwiegend weder Ihrer gewerblichen noch ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können).</p>\n<p>Sie haben das Recht unter Berücksichtigung von §1 Allgeneines, Punkt 4. binnen 1 Monat ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>\n<p>Die Widerrufsfrist beträgt 1 Monat ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, die</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischertrasse 2</p>\n<p>85737 Ismaning / Deutschland</p>\n<p>Telefon : 089 - 54 55 82 64</p>\n<p>E-Mail: info@matten.net</p>\n<p>mit einer eindeutigen Erklärung über Ihren Entschluss informieren (z.B. durch einen mit der Post versandten Brief oder mittels E-Mail), diesen Vertrag zu widerrufen. Sie können den Widerruf formlos nur in schriftlicher Form, z.B. per eMail oder Briefpost vornehmen.</p>\n<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung Ihres Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>"
        },
        {
          "id": "a2-folgen-des-widerrufs",
          "titel": "Folgen des Widerrufs",
          "html": "<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>\n<p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>"
        }
      ]
    },
    "impressum": {
      "titel": "Impressum",
      "rubrik": "Rechtliches",
      "kurz": "Anbieterkennzeichnung nach § 5 TMG.",
      "rechtstext": true,
      "quelle": "matten.net/de/pages/impressum, erfasst am 31.08.2026",
      "abschnitte": [
        {
          "id": "a1-fuchsius-multi-media-gmbh",
          "titel": "FUCHSIUS multi-media GmbH",
          "html": "<p>Fischerstrasse 2</p>\n<p>D-85737 Ismaning</p>\n<p>Telefon: +49 89 54 55 82 64</p>\n<p>Telefax: +49 89 54 55 83 33</p>\n<p>Mobil:  +49 171 77 55 400</p>\n<p>E-Mail:   <a href=\"mailto:info@matten.de\">info@matten.net</a></p>\n<p>Internet: <a href=\"http://www.matten.de/\" target=\"_blank\" rel=\"noopener noreferrer\">www.matten.net</a></p>\n<p>Vertretungsberechtigter Geschäftsführer: Dipl.-Ing. Dieter Fuchsius</p>\n<p>Registergericht: Amtsgericht München</p>\n<p>Registernummer: HRB 161064</p>\n<p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE 246 769 029</p>\n<p>Haftungshinweis: Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.</p>"
        },
        {
          "id": "a2-keine-abmahnung-ohne-vorherigen-kontakt",
          "titel": "Keine Abmahnung ohne vorherigen Kontakt!",
          "html": "<p>Für allgemeine Fragen zu Produkten oder Dienstleistungen des Unternehmens oder weitere Angelegenheiten, die das Unternehmen dieser Seite betreffen, wenden Sie sich bitte direkt an den Seitenbetreiber!</p>\n<p>Sollten Sie irgendwelche Fragen, Probleme, oder rechtliche Forderungen, die den Inhalt dieser Seiten betreffen haben, bitte benachrichtigen Sie den Verantwortlichen Seiteninhaber. Sollte der Inhalt oder die Aufmachung von der Seite (verlinkte Seiten, Texte, Banner) Rechte Dritter oder gesetzliche Bestimmungen verletzen, so bitten wir um eine entsprechende Nachricht ohne Kostennote. Der Betreiber garantiert, die zu Recht beanstandeten Seiten, Banner, Texte unverzüglich zu entfernen, ohne dass von Ihrer Seite die Einschaltung eines Rechtsbeistandes erforderlich ist. Eine Abmahnung ist nicht nötig. Ein kurzer Hinweis per E-Mail genügt. Der Verantwortliche reagiert dann angemessen und ohne Verzögerung auf Ihre Anfragen. Dennoch von Ihnen ohne vorherige Kontaktaufnahme ausgelöste Kosten werden wir vollumfänglich zurückweisen und gegebenenfalls Gegenklage wegen Verletzung vorgenannter Bestimmungen einreichen.</p>\n<p>Widerrufsbelehrung</p>\n<p>Die Widerrufsbelehrung finden Sie unter <a href=\"http://www.matten.de/widerrufsbelehrung\" target=\"_blank\" rel=\"noopener noreferrer\">http://www.matten.de/widerrufsbelehrung</a></p>\n<p>Realisierung und Gestaltung</p>\n<p>BRIANDCO</p>\n<p>brian@briandco.com.de</p>\n<p>Einbindung von facebook-Plugins</p>"
        },
        {
          "id": "a3-datenschutzerklaerung",
          "titel": "Datenschutzerklärung",
          "html": ""
        },
        {
          "id": "a4-geltungsbereich",
          "titel": "Geltungsbereich",
          "html": "<p>Diese Datenschutzerklärung klärt Nutzer über die Art, den Umfang und Zwecke der Erhebung und</p>\n<p>Verwendung personenbezogener Daten durch den verantwortlichen Anbieter</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Fischerstrasse 2</p>\n<p>D- 85737 Ismaning / Deutschland</p>\n<p>Tel.+49 89 54 55 82 64</p>\n<p>eMail: info@matten.net</p>\n<p>www.matten.net</p>"
        },
        {
          "id": "a5-verwendung-von-facebook-social-plugins",
          "titel": "Verwendung von Facebook Social Plugins",
          "html": "<p>Dieses Angebot verwendet Social Plugins (\"Plugins\") des sozialen Netzwerkes facebook.com, welches von der Facebook Inc., 1601 S. California Ave, Palo Alto, CA 94304, USA betrieben wird (\"Facebook\"). Die Plugins sind an einem der Facebook Logos erkennbar (weiß es \"f\" auf blauer Kachel oder ein \"Daumen hoch\"-Zeichen) oder sind mit dem Zusatz \"Facebook Social Plugin\" gekennzeichnet. Die Liste und das Aussehen der Facebook Social Plugins kann hier eingesehen werden: <a href=\"http://developers.facebook.com/plugins\" target=\"_blank\" rel=\"noopener noreferrer\">http://developers.facebook.com/plugins</a>.</p>\n<p>Wenn ein Nutzer eine Webseite dieses Angebots aufruft, die ein solches Plugin enthält, baut sein Browser eine direkte Verbindung mit den Servern von Facebook auf. Der Inhalt des Plugins wird von Facebook direkt an Ihren Browser übermittelt und von diesem in die Webseite eingebunden. Der Anbieter hat daher keinen Einfluss auf den Umfang der Daten, die Facebook mit Hilfe dieses Plugins erhebt und informiert die Nutzer daher entsprechend seinem <a href=\"http://www.facebook.com/help/?faq=17512\" target=\"_blank\" rel=\"noopener noreferrer\">Kenntnisstand</a>:</p>\n<p>Durch die Einbindung der Plugins erhält Facebook die Information, dass ein Nutzer die entsprechende Seite des Angebots aufgerufen hat. Ist der Nutzer bei Facebook eingeloggt, kann Facebook den Besuch seinem Facebook-Konto zuordnen. Wenn Nutzer mit den Plugins interagieren, zum Beispiel den Like Button betätigen oder einen Kommentar abgeben, wird die entsprechende Information von Ihrem Browser direkt an Facebook übermittelt und dort gespeichert. Falls ein Nutzer kein Mitglied von Facebook ist, besteht trotzdem die Möglichkeit, dass Facebook seine IP-Adresse in Erfahrung bringt und speichert. Laut Facebook wird in Deutschland nur eine anonymisierte IP-Adresse gespeichert.</p>\n<p>Zweck und Umfang der Datenerhebung und die weitere Verarbeitung und Nutzung der Daten durch Facebook sowie die diesbezüglichen Rechte und Einstellungsmöglichkeiten zum Schutz der Privatsphäre der Nutzer , können diese den Datenschutzhinweisen von Facebook entnehmen: <a href=\"http://www.facebook.com/policy.php\" target=\"_blank\" rel=\"noopener noreferrer\">http://www.facebook.com/policy.php</a>.</p>\n<p>Wenn ein Nutzer Facebookmitglied ist und nicht möchte, dass Facebook über dieses Angebot Daten über ihn sammelt und mit seinen bei Facebook gespeicherten Mitgliedsdaten verknüpft, muss er sich vor dem Besuch des Internetauftritts bei Facebook ausloggen.</p>\n<p>Ebenfalls ist es möglich Facebook-Social-Plugins mit Add-ons für Ihren Browser zu blocken, zum Beispiel mit dem \"<a href=\"http://webgraph.com/resources/facebookblocker/\" target=\"_blank\" rel=\"noopener noreferrer\">Facebook Blocker</a>\".</p>"
        },
        {
          "id": "a6-twitter",
          "titel": "Twitter",
          "html": "<p>Dieses Angebot nutzt die <a href=\"https://twitter.com/about/resources/buttons\" target=\"_blank\" rel=\"noopener noreferrer\">Schaltflächen des Dienstes Twitter</a>. Diese Schaltflächen werden angeboten durch die Twitter Inc., 795 Folsom St., Suite 600, San Francisco, CA 94107, USA. Sie sind an Begriffen wie \"Twitter\" oder \"Folge\", verbunden mit einem stillisierten blauen Vogel erkennbar. Mit Hilfe der Schaltflächen ist es möglich einen Beitrag oder Seite dieses Angebotes bei Twitter zu teilen oder dem Anbieter bei Twitter zu folgen.</p>\n<p>Wenn ein Nutzer eine Webseite dieses Internetauftritts aufruft, die einen solchen Button enthält, baut sein Browser eine direkte Verbindung mit den Servern von Twitter auf. Der Inhalt des Twitter-Schaltflächen wird von Twitter direkt an den Browser des Nutzers übermittelt. Der Anbieter hat daher keinen Einfluss auf den Umfang der Daten, die Twitter mit Hilfe dieses Plugins erhebt und informiert die Nutzer entsprechend seinem Kenntnisstand. Nach diesem wird lediglich die IP-Adresse des Nutzers die URL der jeweiligen Webseite beim Bezug des Buttons mit übermittelt, aber nicht für andere Zwecke, als die Darstellung des Buttons, genutzt.</p>\n<p>Weitere Informationen hierzu finden sich in der Datenschutzerklärung von Twitter unter http://twitter.com/privacy.</p>"
        },
        {
          "id": "a7-widerruf-aenderungen-berichtigungen-und-aktualis",
          "titel": "Widerruf, änderungen, Berichtigungen und Aktualisierungen",
          "html": "<p>Der Nutzer hat das Recht, auf Antrag unentgeltlich Auskunft zu erhalten über die personenbezogenen Daten, die über ihn gespeichert wurden. Zusätzlich hat der Nutzer das Recht auf Berichtigung unrichtiger Daten, Sperrung und Löschung seiner personenbezogenen Daten, soweit dem keine gesetzliche Aufbewahrungspflicht entgegensteht.</p>"
        }
      ]
    },
    "data-protection": {
      "titel": "Datenschutz",
      "rubrik": "Rechtliches",
      "kurz": "Wie mit personenbezogenen Daten umgegangen wird.",
      "rechtstext": true,
      "quelle": "matten.net/de/pages/data-protection, erfasst am 31.08.2026",
      "abschnitte": [
        {
          "id": "a1-allgemeines",
          "titel": "Allgemeines",
          "html": "<p>Der Schutz Ihrer personenbezogener Daten bei der Erhebung, Verarbeitung und Nutzung bei Ihrem Besuchs auf unserer Homepage ist uns sehr wichtig. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>\n<p>Die Rechtsgrundlage für die Erhebung und Verarbeitung Ihrer personenbezogenen Daten ist in<a href=\"https://dejure.org/gesetze/DSGVO/6.html\" target=\"_blank\" rel=\"noopener noreferrer\"> der DSGVO</a> geregelt. Die bei der Nutzung dieses Webangebots anfallenden Nutzungsdaten nach Telemediengesetz (§ 15 Absatz 1 TMG) werden nur verwendet, um das Angebot zu erbringen.</p>\n<p>Die Suche auf unserer Seite durchsucht nur unser Web-Angebot. Dabei werden keine personenbezogenen Daten protokolliert.</p>\n<p>Sollten Sie mit uns per <a href=\"http://www.baden-wuerttemberg.datenschutz.de/ihr-weg-zu-uns/#E-Mail-Versandt\" target=\"_blank\" rel=\"noopener noreferrer\">E-Mail Kontakt </a>aufnehmen, so verwenden wir Ihre E-Mail-Adresse nur, um mit Ihnen in Kontakt zu treten. Andere Verwendungen schließen wir aus.</p>"
        },
        {
          "id": "a2-datenschutz",
          "titel": "Datenschutz",
          "html": "<p>FUCHSIUS multi-media GmbH als Betreiber dieser Seite „www.matten.de“ behandelt Ihre personenbezogenen Daten sehr sorgsam, vertraulich, entsprechend der gesetzlichen Datenschutzverordnung (DSGVO) und dieser Datenschutzerklärung. Die Nutzung unserer Website ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift, E-Mail-Adressen oder Bilder) erhoben werden, erfolgt dieses nur soweit es für die Bearbeitung Ihrer Anfragen und Aufträge notwendig ist. Wir erhalten Ihre Angaben auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben. Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann, denen wir durch Einsatz von Schutzprogrammen entgegen wirken. Dennoch kann ein absoluter Schutz der Daten vor dem unberechtigten Zugriff durch Dritte ist nicht garantiert werden.</p>"
        },
        {
          "id": "a3-besuch-der-homepage",
          "titel": "Besuch der Homepage",
          "html": "<p>Sie können unsere Homepage besuchen, ohne Angaben zu Ihrer Person zu machen oder sich zu registrieren.</p>"
        },
        {
          "id": "a4-logfiles",
          "titel": "Logfiles:",
          "html": "<p>Bei jedem Zugriff eines Nutzers auf unsere Homepage und bei jedem Abruf einer Datei werden automatisch Daten über diesen Vorgang  erfasst und in einer Protokolldatei gespeichert. Dabei werden im Einzelnen über jeden Abruf folgende Daten gespeichert:</p>\n<ul><li>Name der abgerufenen Datei;</li><li>Datum und Uhrzeit des Abrufs;</li><li>übertragene Datenmenge;</li><li>Meldung über Erfolg oder Mißerfolg des Abruf;</li><li>Beschreibung des verwendeten Webbrowsers-Typs;</li><li>anfragende Domain.</li></ul>\n<p>IP-Adressen werden nicht vollständig erfasst, sondern vor der Speicherung gekürzt, und lassen keinen Rückschluss auf einen bestimmten Computer zu. Die Speicherung dient ausschließlich internen systembezogenen und statistischen Zwecken. Wir verwenden diese Informationen, um den Auftritt unserer Webseite ständig zu verbessern, zu aktualisieren und somit ihre Attraktivität zu erhöhen (Wahrung berechtigter Interessen). Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Eine Zusammenführung der protokollierten Daten mit andern Datenquellen, insbesondere Daten, die eine Zuordnung zu einer bestimmten Person zulassen, wird nicht vorgenommen.</p>"
        },
        {
          "id": "a5-cookies",
          "titel": "Cookies",
          "html": "<p>Unsere Website verwendet Cookies. Das sind kleine Textdateien, die es möglich machen, auf dem Endgerät des Nutzers spezifische, auf den Nutzer bezogene Informationen zu speichern, während er die Website nutzt. Cookies ermöglichen es, insbesondere Nutzungshäufigkeit und Nutzeranzahl der Seiten zu ermitteln, Verhaltensweisen der Seitennutzung zu analysieren, aber auch unser Angebot nutzerfreundlicher zu gestalten. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Die von uns verwendeten Cookies sind so genannte „Session-Cookies“. Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.</p>\n<p>Wenn Sie es nicht wünschen, dass wir Informationen über Ihren Computer wiedererkennen, stellen Sie Ihren Internetbrowser bitte so ein, dass er Cookies von Ihrer Computerfestplatte löscht, alle Cookies blockiert oder Sie warnt, bevor ein Cookie gespeichert wird. Möglicherweise stehen Ihnen dann aber nicht sämtliche Funktionen unserer Homepage zur Verfügung.</p>\n<p>Wenn Sie über einen Link unsere Seite verlassen und so auf fremde Seiten gelangen, kann es sein, dass auch von Adressaten der angeklickten Zielseite Cookies gesetzt werden. Für diese Cookies sind wir rechtlich nicht verantwortlich. Zu der Benutzung solcher Cookies und der darauf gespeicherten Informationen durch Dritte vergleichen Sie bitte deren Datenschutzerklärungen.</p>"
        },
        {
          "id": "a6-youtube",
          "titel": "Youtube",
          "html": "<p>Falls wir Videos in unsere Website einbinden, werden diese über einen eingebetteten YouTube-Player wiedergeben. Betreiber der Videoplattform YouTube ist YouTube, LLC, 901 Cherry Ave., San Bruno, CA 94066, USA, vertreten durch Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Wenn Sie auf unserer Website eine Seite mit eingebettetem YouTube-Player aufrufen, wird eine Verbindung zu den Servern von YouTube/Google aufgebaut. Dabei wird dem Server Ihre IP-Adresse zusammen mit URL des aufgerufenen Videos übermittelt. Wenn Sie bei Google eingeloggt sind, kann YouTube/Google diese Information Ihnen zuordnen und in Ihrem persönlichen Profil verarbeiten.</p>\n<p>Wenn Sie nicht möchten, dass Google Daten über Sie sammelt und mit Ihren persönlichen Profil verknüpft, müssen Sie sich vor dem Besuch unserer Website bei Google ausloggen. Weitere Informationen zur Erhebung und Nutzung Ihrer Daten durch YouTube erhalten Sie in den dortigen Hinweisen zum Datenschutz unter https://policies.google.com/privacy?hl=de&amp;gl=de</p>"
        },
        {
          "id": "a7-anfragen-und-vertraege",
          "titel": "Anfragen und Verträge",
          "html": "<p>Soweit Sie uns personenbezogene Daten zur Verfügung gestellt haben, verwenden wir diese ausschließlich zum Zweck der technischen Administration unserer Webseiten und zur Erfüllung Ihrer Wünsche und Anforderungen, insbesondere zur Abwicklung der uns übermittelten Anfragen oder zur Bearbeitung Ihrer Aufträge.</p>\n<p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, können Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert werden. Rechtgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (vorvertragliche Maßnahmen und Vertragserfüllung).</p>\n<p>Eine Weitergabe, ein Verkauf oder sonstige Übermittlung Ihrer personenbezogenen Daten an Dritte erfolgt nicht, es sei denn, dass</p>\n<ul><li>dies zum Zwecke der Klärung Ihrer Anfragen erforderlich ist und soweit beispielsweise Auskünfte bei Kommunen oder Behörden einzuholen sind, die hierzu Ihren Namen und Ihre Anschrift benötigen;</li><li>dies zu Abrechnungszwecken erforderlich ist;</li><li>zuvor in die Weitergabe Ihrer Daten ausdrücklich eingewilligt haben.</li></ul>\n<p>Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 Buchstabe a DSGVO (Einwilligung).</p>"
        },
        {
          "id": "a8-sonstige-kundenpflege",
          "titel": "Sonstige Kundenpflege",
          "html": "<p>Ohne Ihre Einwilligung nutzen wir personenbezogene Daten lediglich im gesetzlich zulässigen Umfang, d.h. für  den Versand von Informationen per Post. Ihre E-Mail-Adresse, Fax- und Telefonnummer nutzen wir ohne ausdrückliche Einwilligung nicht. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGV (Wahrnehmung berechtigter Interessen).</p>"
        },
        {
          "id": "a9-dauer-der-speicherung",
          "titel": "Dauer der Speicherung",
          "html": "<p>Wir löschen Ihre Daten, wenn sie nach Bearbeitung einer Anfrage bzw. Beendigung des Vertrages nicht mehr erforderlich sind. Davon ausgenommen sind Daten, die wir aufgrund gesetzlicher Verpflichtung noch nicht löschen dürfen (z.B. Unterlagen, die nach Steuerrecht und Handelsrecht aufzubewahren sind) und Daten, die wir zur Wahrnehmung berechtigter Interessen benötigen, insbesondere zur Geltendmachung von Ansprüchen.</p>"
        },
        {
          "id": "a10-ihre-rechte",
          "titel": "Ihre Rechte",
          "html": "<p>Sie haben, wenn die jeweiligen gesetzlichen Voraussetzungen vorliegen, die folgenden Rechte:</p>\n<ul><li>Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO).</li><li>Sie haben das Recht, die Berichtigung von unzutreffenden Daten zu verlangen (Art. 16 DSGVO).</li><li>Sie haben das Recht, die Löschung (Art. 17) oder die Einschränkung der Verarbeitung (Art. 18 DSGVO) nicht mehr benötigter Daten zu verlangen. Soweit gesetzliche Aufbewahrungspflichten bestehen, z.B. für geschäftliche Korrespondenz nach Handelsrecht und Steuerrecht oder eine andere gesetzliche Ausnahme besteht, werden Daten nicht gelöscht, sondern nur die Verarbeitung eingeschränkt.</li></ul>\n<p>Für die Geltendmachung Ihrer Rechte wenden Sie sich bitte an:</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischerstraße 2</p>\n<p>D-85737 Ismaning</p>\n<p>info@matten.de</p>\n<p>Mobil: +49 171 77 55 400.</p>\n<p>Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei einer Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>"
        }
      ]
    },
    "datenschutzerklarung-dsgvo": {
      "titel": "Datenschutzerklärung (DSGVO)",
      "rubrik": "Rechtliches",
      "kurz": "Die zweite, fast wortgleiche Datenschutzfassung der Vorlage.",
      "rechtstext": true,
      "quelle": "matten.net/de/pages/datenschutzerklarung-dsgvo, erfasst am 31.08.2026",
      "abschnitte": [
        {
          "id": "a1",
          "titel": null,
          "html": "<p>Datenschutzerklärung nach EU-Datenschutzverordnung (DSGVO) <a href=\"http://www.matten.net/\" target=\"_blank\" rel=\"noopener noreferrer\">zur Website: www.matten.net</a></p>"
        },
        {
          "id": "a2-allgemeines",
          "titel": "Allgemeines",
          "html": "<p>Der Schutz Ihrer personenbezogener Daten bei der Erhebung, Verarbeitung und Nutzung bei Ihrem Besuchs auf unserer Homepage ist uns sehr wichtig. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>\n<p>Die Rechtsgrundlage für die Erhebung und Verarbeitung Ihrer personenbezogenen Daten ist in<a href=\"https://dejure.org/gesetze/DSGVO/6.html\" target=\"_blank\" rel=\"noopener noreferrer\"> der DSGVO</a> geregelt. Die bei der Nutzung dieses Webangebots anfallenden Nutzungsdaten nach Telemediengesetz (§ 15 Absatz 1 TMG) werden nur verwendet, um das Angebot zu erbringen.</p>\n<p>Die Suche auf unserer Seite durchsucht nur unser Web-Angebot. Dabei werden keine personenbezogenen Daten protokolliert.</p>\n<p>Sollten Sie mit uns per <a href=\"http://www.baden-wuerttemberg.datenschutz.de/ihr-weg-zu-uns/#E-Mail-Versandt\" target=\"_blank\" rel=\"noopener noreferrer\">E-Mail Kontakt </a>aufnehmen, so verwenden wir Ihre E-Mail-Adresse nur, um mit Ihnen in Kontakt zu treten. Andere Verwendungen schließen wir aus.</p>"
        },
        {
          "id": "a3-datenschutz",
          "titel": "Datenschutz",
          "html": "<p>FUCHSIUS multi-media GmbH als Betreiber dieser Seite „www.matten.de“ behandelt Ihre personenbezogenen Daten sehr sorgsam, vertraulich, entsprechend der gesetzlichen Datenschutzverordnung (DSGVO) und dieser Datenschutzerklärung. Die Nutzung unserer Website ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift, E-Mail-Adressen oder Bilder) erhoben werden, erfolgt dieses nur soweit es für die Bearbeitung Ihrer Anfragen und Aufträge notwendig ist. Wir erhalten Ihre Angaben auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben. Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann, denen wir durch Einsatz von Schutzprogrammen entgegen wirken. Dennoch kann ein absoluter Schutz der Daten vor dem unberechtigten Zugriff durch Dritte ist nicht garantiert werden.</p>"
        },
        {
          "id": "a4-besuch-der-homepage",
          "titel": "Besuch der Homepage",
          "html": "<p>Sie können unsere Homepage besuchen, ohne Angaben zu Ihrer Person zu machen oder sich zu registrieren.</p>"
        },
        {
          "id": "a5-logfiles",
          "titel": "Logfiles:",
          "html": "<p>Bei jedem Zugriff eines Nutzers auf unsere Homepage und bei jedem Abruf einer Datei werden automatisch Daten über diesen Vorgang erfasst und in einer Protokolldatei gespeichert. Dabei werden im Einzelnen über jeden Abruf folgende Daten gespeichert:</p>\n<ul><li>Name der abgerufenen Datei;</li><li>Datum und Uhrzeit des Abrufs;</li><li>übertragene Datenmenge;</li><li>Meldung über Erfolg oder Mißerfolg des Abruf;</li><li>Beschreibung des verwendeten Webbrowsers-Typs;</li><li>anfragende Domain.</li></ul>\n<p>IP-Adressen werden nicht vollständig erfasst, sondern vor der Speicherung gekürzt, und lassen keinen Rückschluss auf einen bestimmten Computer zu. Die Speicherung dient ausschließlich internen systembezogenen und statistischen Zwecken. Wir verwenden diese Informationen, um den Auftritt unserer Webseite ständig zu verbessern, zu aktualisieren und somit ihre Attraktivität zu erhöhen (Wahrung berechtigter Interessen). Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Eine Zusammenführung der protokollierten Daten mit andern Datenquellen, insbesondere Daten, die eine Zuordnung zu einer bestimmten Person zulassen, wird nicht vorgenommen.</p>"
        },
        {
          "id": "a6-cookies",
          "titel": "Cookies",
          "html": "<p>Unsere Website verwendet Cookies. Das sind kleine Textdateien, die es möglich machen, auf dem Endgerät des Nutzers spezifische, auf den Nutzer bezogene Informationen zu speichern, während er die Website nutzt. Cookies ermöglichen es, insbesondere Nutzungshäufigkeit und Nutzeranzahl der Seiten zu ermitteln, Verhaltensweisen der Seitennutzung zu analysieren, aber auch unser Angebot nutzerfreundlicher zu gestalten. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Die von uns verwendeten Cookies sind so genannte „Session-Cookies“. Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.</p>\n<p>Wenn Sie es nicht wünschen, dass wir Informationen über Ihren Computer wiedererkennen, stellen Sie Ihren Internetbrowser bitte so ein, dass er Cookies von Ihrer Computerfestplatte löscht, alle Cookies blockiert oder Sie warnt, bevor ein Cookie gespeichert wird. Möglicherweise stehen Ihnen dann aber nicht sämtliche Funktionen unserer Homepage zur Verfügung.</p>\n<p>Wenn Sie über einen Link unsere Seite verlassen und so auf fremde Seiten gelangen, kann es sein, dass auch von Adressaten der angeklickten Zielseite Cookies gesetzt werden. Für diese Cookies sind wir rechtlich nicht verantwortlich. Zu der Benutzung solcher Cookies und der darauf gespeicherten Informationen durch Dritte vergleichen Sie bitte deren Datenschutzerklärungen.</p>"
        },
        {
          "id": "a7-youtube",
          "titel": "Youtube",
          "html": "<p>Falls wir Videos in unsere Website einbinden, werden diese über einen eingebetteten YouTube-Player wiedergeben. Betreiber der Videoplattform YouTube ist YouTube, LLC, 901 Cherry Ave., San Bruno, CA 94066, USA, vertreten durch Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Wenn Sie auf unserer Website eine Seite mit eingebettetem YouTube-Player aufrufen, wird eine Verbindung zu den Servern von YouTube/Google aufgebaut. Dabei wird dem Server Ihre IP-Adresse zusammen mit URL des aufgerufenen Videos übermittelt. Wenn Sie bei Google eingeloggt sind, kann YouTube/Google diese Information Ihnen zuordnen und in Ihrem persönlichen Profil verarbeiten.</p>\n<p>Wenn Sie nicht möchten, dass Google Daten über Sie sammelt und mit Ihren persönlichen Profil verknüpft, müssen Sie sich vor dem Besuch unserer Website bei Google ausloggen. Weitere Informationen zur Erhebung und Nutzung Ihrer Daten durch YouTube erhalten Sie in den dortigen Hinweisen zum Datenschutz unter https://policies.google.com/privacy?hl=de&amp;gl=de</p>"
        },
        {
          "id": "a8-anfragen-und-vertraege",
          "titel": "Anfragen und Verträge",
          "html": "<p>Soweit Sie uns personenbezogene Daten zur Verfügung gestellt haben, verwenden wir diese ausschließlich zum Zweck der technischen Administration unserer Webseiten und zur Erfüllung Ihrer Wünsche und Anforderungen, insbesondere zur Abwicklung der uns übermittelten Anfragen oder zur Bearbeitung Ihrer Aufträge.</p>\n<p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, können Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert werden. Rechtgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (vorvertragliche Maßnahmen und Vertragserfüllung).</p>\n<p>Eine Weitergabe, ein Verkauf oder sonstige Übermittlung Ihrer personenbezogenen Daten an Dritte erfolgt nicht, es sei denn, dass</p>\n<ul><li>dies zum Zwecke der Klärung Ihrer Anfragen erforderlich ist und soweit beispielsweise Auskünfte bei Kommunen oder Behörden einzuholen sind, die hierzu Ihren Namen und Ihre Anschrift benötigen;</li><li>dies zu Abrechnungszwecken erforderlich ist;</li><li>zuvor in die Weitergabe Ihrer Daten ausdrücklich eingewilligt haben.</li></ul>\n<p>Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 Buchstabe a DSGVO (Einwilligung).</p>"
        },
        {
          "id": "a9-sonstige-kundenpflege",
          "titel": "Sonstige Kundenpflege",
          "html": "<p>Ohne Ihre Einwilligung nutzen wir personenbezogene Daten lediglich im gesetzlich zulässigen Umfang, d.h. für den Versand von Informationen per Post. Ihre E-Mail-Adresse, Fax- und Telefonnummer nutzen wir ohne ausdrückliche Einwilligung nicht. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGV (Wahrnehmung berechtigter Interessen).</p>"
        },
        {
          "id": "a10-dauer-der-speicherung",
          "titel": "Dauer der Speicherung",
          "html": "<p>Wir löschen Ihre Daten, wenn sie nach Bearbeitung einer Anfrage bzw. Beendigung des Vertrages nicht mehr erforderlich sind. Davon ausgenommen sind Daten, die wir aufgrund gesetzlicher Verpflichtung noch nicht löschen dürfen (z.B. Unterlagen, die nach Steuerrecht und Handelsrecht aufzubewahren sind) und Daten, die wir zur Wahrnehmung berechtigter Interessen benötigen, insbesondere zur Geltendmachung von Ansprüchen.</p>"
        },
        {
          "id": "a11-ihre-rechte",
          "titel": "Ihre Rechte",
          "html": "<p>Sie haben, wenn die jeweiligen gesetzlichen Voraussetzungen vorliegen, die folgenden Rechte:</p>\n<ul><li>Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO).</li><li>Sie haben das Recht, die Berichtigung von unzutreffenden Daten zu verlangen (Art. 16 DSGVO).</li><li>Sie haben das Recht, die Löschung (Art. 17) oder die Einschränkung der Verarbeitung (Art. 18 DSGVO) nicht mehr benötigter Daten zu verlangen. Soweit gesetzliche Aufbewahrungspflichten bestehen, z.B. für geschäftliche Korrespondenz nach Handelsrecht und Steuerrecht oder eine andere gesetzliche Ausnahme besteht, werden Daten nicht gelöscht, sondern nur die Verarbeitung eingeschränkt.</li></ul>\n<p>Für die Geltendmachung Ihrer Rechte wenden Sie sich bitte an:</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischerstraße 2</p>\n<p>D-85737 Ismaning</p>\n<p>info@matten.net</p>\n<p>Mobil: +49 171 77 55 400.</p>\n<p>Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei einer Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>"
        }
      ]
    }
  };

  /* Zweitnamen. Die Vorlage fuehrt zwei fast gleiche Datenschutztexte;
     beide bleiben erreichbar, damit nichts verlorengeht. */
  var ALIAS = {
    'datenschutz': 'data-protection',
    'dsgvo': 'datenschutzerklarung-dsgvo',
    'datenschutzerklaerung-dsgvo': 'datenschutzerklarung-dsgvo',
    'widerrufsbelehrung': 'widerruf',
    'widerrufsrecht': 'widerruf'
  };

  /* Seiten, die die Navigation schon verlinkt, fuer die es aber in der
     Vorlage keinen Text gibt. Sie bekommen einen ehrlichen Leerzustand
     statt erfundener Inhalte. */
  var OHNE_TEXT = {
    'versand':       'Versand & Lieferung',
    'zahlung':       'Zahlungsarten',
    'kontakt':       'Kontakt',
    'ueber-uns':     'Über uns',
    'faq':           'Häufige Fragen',
    'musterservice': 'Musterservice'
  };

  /* ======================================================================
     Blogbeitraege der Vorlage (2 Stueck, Reihenfolge wie dort)
     ====================================================================== */

  var BEITRAEGE = [
    {
      slug: 'der-mattenfuchs',
      titel: 'FUCHSIUS multi-media GmbH',
      datum: 'February 1, 2019 08:06',
      absaetze: [
        'Seit mehr als 35 Jahren liefern wir Fussmatten in einer Vielzahl von Standardmaßen und ' +
        'nahezu beliebigen Wunschmaßen in mehr als 100 verschiedenen Farben, einfarbig und ' +
        'individuell nach Kundenwunsch gestaltet.',
        'Wir haben in dieser Zeit weltweit in vielen namhaften Firmen, Top-Handelshäusern und ' +
        'Filialunternehmen, Hotels, Verwaltungen, Ladengeschäften und Privathaushalten für saubere ' +
        'Eingangsbereiche und den Schutz der angrenzenden Böden gesorgt.',
        'Unsere Angebotspalette ist in den zurückliegenden Jahren stetig gewachsen und wurde den ' +
        'permanent steigenden Anforderungen laufend angepasst. So haben wir für jedes Schmutzproblem ' +
        '-und auch für die passende Werbung für Ihr Haus- immer eine hervorragende Lösung parat. ' +
        '"NICHTS" gibt es nicht bei uns.',
        'Wir sind stets für Sie unter "info@matten.de" erreichbar und freuen uns über Ihre Anfrage.',
        'Ihr Mattenfuchs-Team'
      ]
    },
    {
      slug: 'eine-neue-mattengeneration',
      titel: 'Eine neue Mattengeneration',
      datum: 'August 17, 2019 09:05',
      absaetze: [
        'Matten mit fotorealistischer Gestaltung.',
        'Als Vorlage genügt eine Foto und Ihre Wunschgrößen-Angabe'
      ]
    }
  ];

  /* ======================================================================
     Infoseiten — seite.html
     ====================================================================== */

  function slugAusAdresse() {
    var p = new URLSearchParams(window.location.search);
    var s = (p.get('s') || p.get('seite') || '').trim().toLowerCase();
    return ALIAS[s] || s;
  }

  var HINWEIS_RECHT =
    '<p class="hinweis hinweis--warnung" role="note">' +
      '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
      '<span><span class="hinweis__titel">Übernommener Platzhaltertext — rechtlich ungeprüft</span>' +
      'Dieser Text ist wortgetreu aus der Vorlage übernommen und dient dem Aufbau der Seite. ' +
      'Er ist <strong>nicht</strong> rechtlich geprüft und in Teilen erkennbar veraltet: er nennt ' +
      'durchgehend die alte Anschrift „www.matten.de“, verweist auf Seiten, die es nicht mehr gibt, ' +
      'und trägt Tippfehler aus dem Original. Vor einem echten Betrieb muss ein Fachkundiger ihn ' +
      'prüfen und ersetzen.</span></p>';

  function baueInfoseite() {
    var inhalt = $('seite-inhalt');
    if (!inhalt) return;

    var slug = slugAusAdresse();
    var daten = SEITEN[slug];

    var titelEl = $('seite-titel');
    var rubrikEl = $('seite-rubrik');
    var navEl = $('seite-nav');

    /* --- Kein Slug angegeben: die vorhandenen Seiten auflisten. --------- */
    if (!slug) {
      titelEl.textContent = 'Informationen';
      rubrikEl.textContent = 'Übersicht';
      document.title = 'Informationen | Mattenfuchs';
      inhalt.innerHTML = '<p>Diese Hülle zeigt die Informationsseiten des Shops. ' +
        'Vorhanden sind:</p><ul>' +
        Object.keys(SEITEN).map(function (k) {
          return '<li><a href="seite.html?s=' + encodeURIComponent(k) + '">' +
                 esc(SEITEN[k].titel) + '</a> — ' + esc(SEITEN[k].kurz) + '</li>';
        }).join('') + '</ul>';
      inhalt.removeAttribute('aria-busy');
      if (navEl) navEl.innerHTML = '';
      setzeKrume('Informationen');
      return;
    }

    /* --- Slug bekannt, aber kein Text vorhanden. ------------------------ */
    if (!daten) {
      var name = OHNE_TEXT[slug] || null;
      titelEl.textContent = name || 'Seite nicht gefunden';
      rubrikEl.textContent = name ? 'Service' : 'Hinweis';
      document.title = (name || 'Seite nicht gefunden') + ' | Mattenfuchs';
      setzeKrume(name || 'Seite nicht gefunden');
      inhalt.innerHTML = name
        ? '<div class="leer"><h2>Für diese Seite gibt es noch keinen Text</h2>' +
          '<p>Die Vorlage matten.net führt dazu keinen Inhalt. Der Text muss geschrieben werden, ' +
          'bevor die Seite in Betrieb geht — erfunden wird hier nichts.</p>' +
          '<div class="btn-gruppe"><a class="btn" href="index.html">Zum Sortiment</a>' +
          '<a class="btn btn--sekundaer" href="seite.html">Alle Informationsseiten</a></div></div>'
        : '<div class="leer"><h2>Diese Seite gibt es nicht</h2>' +
          '<p>Die Adresse <code>' + esc(window.location.search) + '</code> gehört zu keiner ' +
          'hinterlegten Seite.</p>' +
          '<div class="btn-gruppe"><a class="btn" href="index.html">Zur Startseite</a>' +
          '<a class="btn btn--sekundaer" href="seite.html">Alle Informationsseiten</a></div></div>';
      inhalt.removeAttribute('aria-busy');
      if (navEl) navEl.innerHTML = '';
      return;
    }

    /* --- Der eigentliche Text. ----------------------------------------- */
    titelEl.textContent = daten.titel;
    rubrikEl.textContent = daten.rubrik;
    document.title = daten.titel + ' | Mattenfuchs';
    setzeKrume(daten.titel);

    var html = daten.rechtstext ? HINWEIS_RECHT : '';
    daten.abschnitte.forEach(function (a) {
      if (a.titel) {
        html += '<h2 id="' + esc(a.id) + '">' + esc(a.titel) + '</h2>';
      }
      html += a.html;
    });
    html += '<p class="quelle">Wortlaut übernommen aus: ' + esc(daten.quelle) +
            '. Die Erfassung erfolgte ausschließlich lesend.</p>';

    inhalt.innerHTML = html;
    inhalt.removeAttribute('aria-busy');
    inhalt.removeAttribute('data-laedt');

    /* Inhaltsverzeichnis aus den Abschnitten. */
    if (navEl) {
      var mitTitel = daten.abschnitte.filter(function (a) { return a.titel; });
      navEl.innerHTML = mitTitel.length
        ? '<ol>' + mitTitel.map(function (a) {
            return '<li><a href="#' + esc(a.id) + '">' + esc(a.titel) + '</a></li>';
          }).join('') + '</ol>'
        : '<p class="klein gedeckt">Diese Seite hat keine Zwischenüberschriften.</p>';
    }
  }

  /* Letztes Glied der Brotkrume nachziehen. */
  function setzeKrume(text) {
    var el = document.querySelector('.brotkrumen [aria-current="page"]');
    if (el) el.textContent = text;
  }

  /* ======================================================================
     Blog — blog.html
     ====================================================================== */

  function baueBlog() {
    var liste = $('blog-liste');
    if (!liste) return;

    var einzel = (new URLSearchParams(window.location.search).get('b') || '').trim();
    var zeigen = einzel ? BEITRAEGE.filter(function (b) { return b.slug === einzel; }) : BEITRAEGE;

    if (!zeigen.length) {
      liste.innerHTML =
        '<div class="leer"><h2>Diesen Beitrag gibt es nicht</h2>' +
        '<p>Die Adresse gehört zu keinem der beiden Beiträge.</p>' +
        '<div class="btn-gruppe"><a class="btn" href="blog.html">Alle Beiträge</a></div></div>';
      liste.removeAttribute('aria-busy');
      return;
    }

    liste.innerHTML = zeigen.map(function (b) {
      return '<article class="beitrag">' +
        '<h2 class="beitrag__titel">' + esc(b.titel) + '</h2>' +
        '<p class="beitrag__datum"><time>' + esc(b.datum) + '</time></p>' +
        '<div class="beitrag__text">' +
          b.absaetze.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '</div>' +
        (einzel ? '' :
          '<p class="mt-4"><a class="weiterlink" href="blog.html?b=' + encodeURIComponent(b.slug) +
          '">Weiterlesen<span class="nur-sr">: ' + esc(b.titel) + '</span></a></p>') +
        '</article>';
    }).join('');
    liste.removeAttribute('aria-busy');
    liste.removeAttribute('data-laedt');

    var zurueck = $('blog-zurueck');
    if (zurueck) zurueck.hidden = !einzel;

    if (einzel) {
      document.title = zeigen[0].titel + ' | Mattenfuchs';
      setzeKrume(zeigen[0].titel);
    }
  }

  /* ======================================================================
     Gaestebuch — gaestebuch.html
     ====================================================================== */

  function baueGaestebuch() {
    var liste = $('gb-liste');
    if (!liste) return;
    /* Die Vorlage rendert unter /de/guest-book nichts: keine Eintraege,
       kein Formular, keine Struktur. Es gibt also auch nichts zu zeigen. */
    liste.innerHTML = '';
    liste.hidden = true;
    liste.removeAttribute('aria-busy');
    liste.removeAttribute('data-laedt');
    var leer = $('gb-leer');
    if (leer) leer.hidden = false;
  }

  /* ======================================================================
     Start
     ====================================================================== */

  baueInfoseite();
  baueBlog();
  baueGaestebuch();
})();
