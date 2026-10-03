<?php

class SpezialoptionSpezial extends Spezialoption{
    
    public function getFrontendForm($artikel = null){
        ob_start();
        $s = MM::shop();
        
        /**if(!empty($artikel)){
            var_dump($artikel);
        }**/
        
        $artikel;
        $artikel = $this->getArtikel();
        ?>
        	<div class='spezialoption spezoptspez'>
        		<?php if($this->getSpezialCalc() == "custom" OR $this->getSpezialCalc() == "umf"){?>
        		<div>
        			<?$b=$this->getBeschreibung();echo $b?htmlspecialchars($s->text($b, 'attribute')).':':''?> 
        			<input min="<?=$this->get('minL')?>" max="<?=$this->get('maxL')?>" onkeyup="artikel_update_prices();" class='form-control spezialtextinput autocomplete_off' size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][x]'/>
        			<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        			<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			×
        			<input min="<?=$this->get('minB')?>" max="<?=$this->get('maxB')?>" onkeyup="artikel_update_prices();" class='form-control spezialtextinput autocomplete_off' size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][y]'/>
        			<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        			<?$b=$this->getBeschreibungY();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			<p class="minMaxAlert" style="color:red;">Bitte beachten Sie die Mindest- sowie Maximalmaße!</p>
        			<p>	Mindestmaße: 
        				<?=$this->get('minL')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        				x 
        				<?=$this->get('minB')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungY();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			<p>	Maximalmaße:
        				<?=$this->get('maxL')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        				x 
        				<?=$this->get('maxB')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungY();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			</p>
        			
        		</div>
        		
        		<input type="hidden" class="spezialoption" name="spezialoption[<?=$this->getArtikel()->getId()?>][spezial][sqmprice]" value="<?=htmlspecialchars($s->text($this->getQuadratmeterPreis(), 'attribute'))?>">
        		
        		<?php }else if($this->getSpezialCalc() == "varL"){?>
        		<div class='attribute row'>
                    	<?foreach($artikel->getAttribute() as $attribut): /* @var $attribut ArtikelAttribut */ ?>
                    	<?php if($attribut->getCode() !== "Breite"){ //Felder aussetzen
                    		continue;
                    	}?>
                    	<div style="margin-left:15px;">
                    		<select class='form-control artikelselect' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][x]'>
                    			<?foreach($attribut->getWerte() as $werta): /*@var $wert array */ ?>
                    				<?=option_tag($werta['wert'], $attribut->getSelectedWert(), 
                    				$attribut->getName().' '. $attribut->getWertName($werta['wert']) /*. ($werta['preis']>0?" (+".german_format($werta['preis'],2)." €)":'') */)?>
                    			<?endforeach?>
                    		</select>
                    		 x 
                    <input min="<?=$this->get('minL')?>" max="<?=$this->get('maxL')?>" onkeyup="artikel_update_prices();" class='form-control spezialtextinput autocomplete_off' size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][y]' />
        			<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        			<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
                    	</div>
                    <?endforeach?>
                </div>
        		<div>
        			
        			
				</div>
        			
        			
        			<p class="minMaxAlert" style="color:red;">Bitte beachten Sie die Mindest- sowie Maximalmaße!</p>
        			<p>	
        			
        				Mindestmaße:
        				<?=$this->get('minL')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        				
        				Maximalmaße: 
        				<?=$this->get('maxL')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			</p>
                   
        		<div class="col-md-6">

        		<?php }else{ ?>
        		<div>
        			<?$b=$this->getBeschreibung();echo $b?htmlspecialchars($s->text($b, 'attribute')).':':''?> 
        			<input min="<?=$this->get('minB')?>" max="<?=$this->get('maxB')?>" onkeyup="artikel_update_prices();" class='form-control spezialtextinput autocomplete_off' size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][y]' value='<?=$this->getY()*$this->getEingabeEinheitFaktor()?>' />
        			<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        			<?$b=$this->getBeschreibungY();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>	
        			<p class="minMaxAlert" style="color:red;">Bitte beachten Sie die Mindest- sowie Maximalmaße!</p>
        			<p>	Maximalmaße: 
        				<?=$this->get('maxB')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungY();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			</p>
        			<p>	Mindestmaße:
        				<?=$this->get('minB')?>
        				<?=htmlspecialchars($s->text($this->getEingabeEinheit(), 'attribute'))?>
        				<?$b=$this->getBeschreibungX();echo $b?htmlspecialchars($s->text($b, 'attribute')):''?>
        			</p>
        			<div class='attribute row'>
        				<?foreach($artikel->getAttribute() as $attribut): /* @var $attribut ArtikelAttribut */ ?>
						<?php if($attribut->getCode() == "Grundfarbe" OR $attribut->getCode() == "Designfarbe" OR $attribut->getCode() == 'Standardgröße' OR $attribut->getCode() == 'Nitril-Gummirand' OR $attribut->getCode() == 'Breite'){ //Felder aussetzen
							continue;
						}?>
						<div class="col-md-6">
							<select class='form-control artikelselect' name='attribute[<?=$attribut->getCode()?>]'>
								<?foreach($attribut->getWerte() as $werta): /*@var $wert array */ ?>
									<?=option_tag($werta['wert'], $attribut->getSelectedWert(), 
									$attribut->getName().' '. $attribut->getWertName($werta['wert']) /*. ($werta['preis']>0?" (+".german_format($werta['preis'],2)." €)":'') */)?>
								<?endforeach?>
							</select>
						</div>
					<?endforeach?>
					</div>
        		</div>
        		<?php }?>
    		</div>
    		</div>
		<?php 
        return ob_get_clean();
    }
    
    
    
    public function getAdminForm(){
        ob_start();
        ?>
        	Diese Spezialoption erlaubt die Auswahl und Eingabe verschiedener Spezialoptionen in Kombination.<br>
        	<select class="spezialCalc" name="spezialoption[<?=$this->getArtikel()->getId()?>][spezial][calc]" value='<?=htmlspecialchars($this->getSpezialCalc())?>'>
        		<option <?php if($this->getSpezialCalc() == "custom"){echo "selected";}?> value="custom">Länge x Breite variabel</option>
        		<option <?php if($this->getSpezialCalc() == "varL"){echo "selected";}?> value="varL">Länge variabel</option>
        		<option <?php if($this->getSpezialCalc() == "umf"){echo "selected";}?> value="umf">Umfang</option>
        		
        	</select>
        	<table>
        		<tr>
        			<td width="120">Beschreibung:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][desc]' value='<?=htmlspecialchars($this->getBeschreibung())?>' /></td>
        			<td width="120">Mindest X:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][minL]' value='<?=htmlspecialchars($this->getMinLaenge())?>'></td>
        		</tr>
        		
        		<tr>
        			<td width="120">Bezeichnung X:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][desc_x]' value='<?=htmlspecialchars($this->getBeschreibungX())?>' /></td>
        			<td width="120">Maximal X:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][maxL]' value='<?=htmlspecialchars($this->getMaxLaenge())?>'></td>
        		</tr>
        		
        		<tr class="vlInput">
        			<td width="120">Bezeichnung Y:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][desc_y]' value='<?=htmlspecialchars($this->getBeschreibungY())?>' /></td>
        			<td width="120">Mindest Y:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][minB]' value='<?=htmlspecialchars($this->getMinBreite())?>'></td>
        		</tr>
        		
        		<tr>
        			<td width="120">Einheit:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][unit]' value='<?=htmlspecialchars($this->getEinheit())?>' /></td>
        			<td class="vlInput" width="120">Maximal Y:</td><td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][maxB]' value='<?=htmlspecialchars($this->getMaxBreite())?>'></td>
        		</tr>
        		
        		<tr>
        			<td width="120">Eingabeeinheit:</td>
        			<td><input name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_unit]' value='<?=htmlspecialchars($this->getEingabeEinheit())?>' /></td>
        		</tr>
				        		<tr>
        			<td width="120">Umrechnungsfaktor:</td>
        			<td>
        				<input size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_unit_factor]' value='<?=htmlspecialchars($this->getEingabeEinheitFaktor())?>' />
        			</td>
        		</tr>
        		<tr id="sqm_prices">
        			<td width="120">Quadratmeterpreis Netto in € (Maßanfertigung):</td>
        			<td><input id="netSqm" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_squaremeter_price]' value='<?=htmlspecialchars($this->getQuadratmeterPreis())?>' /></td>
        			<td width="120">Quadratmeterpreis Brutto in € (Maßanfertigung):</td>
        			<td><input id="groSqm" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_squaremeter_price_gross]' value='<?=htmlspecialchars($this->getQuadratmeterPreisBrutto())?>' /></td>
        		</tr>
        		<tr id="sqm_prices_ek">
        			<td width="120">Quadratmeterpreis Ek Netto in € (Maßanfertigung):</td>
        			<td><input id="netSqmEk" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_squaremeter_price_ek]' value='<?=htmlspecialchars($this->getQuadratmeterPreisEk())?>' /></td>
        			<td width="120">Quadratmeterpreis Ek Brutto in € (Maßanfertigung):</td>
        			<td><input id="groSqmEk" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_squaremeter_price_ek_gross]' value='<?=htmlspecialchars($this->getQuadratmeterPreisEkBrutto())?>' /></td>
        		</tr>
        		<tr id="scope_prices">
        			<td width="120">Preis / Länge Netto in € (Maßanfertigung):</td>
        			<td><input id="netScope" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_scope_price]' value='<?=htmlspecialchars($this->getUmfangPreis())?>' /></td>
        			<td width="120">Preis / Länge Brutto in € (Maßanfertigung):</td>
        			<td><input id="groScope" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_scope_price_gross]' value='<?=htmlspecialchars($this->getUmfangPreisBrutto())?>' /></td>
        		</tr>
        		<tr id="scope_prices_ek">
        			<td width="120">Preis / Länge Ek Netto in € (Maßanfertigung):</td>
        			<td><input id="netScopeEk" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_scope_price_ek]' value='<?=htmlspecialchars($this->getUmfangPreisEk())?>' /></td>
        			<td width="120">Preis / Länge Ek Brutto in € (Maßanfertigung):</td>
        			<td><input id="groScopeEk" size='5' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][input_scope_price_ek_gross]' value='<?=htmlspecialchars($this->getUmfangPreisekBrutto())?>' /></td>
        		</tr>

        		</table>

        		<?php /* ----------------------------------------------------------------
        		   Preisformel des Auftraggebers (Excel-Mappe).
        		   Solange der Schalter unten auf "Nein" steht, rechnet der Shop
        		   genau wie bisher: Fläche × Quadratmeterpreis. Erst mit "Ja"
        		   greift die Formel aus der Mappe.
        		   Leere Felder sind kein Fehler — dann gilt der Vorgabewert, der
        		   im Feld als Platzhalter steht.
        		   ---------------------------------------------------------------- */ ?>
        		<fieldset style="margin-top:1em;border:1px solid #999;padding:0.5em;">
        		<legend><strong>Preisformel (Excel-Mappe)</strong></legend>
        		<p style="margin:0 0 0.5em 0;">
        			Hier stehen die Stammgrößen der Preisformel. <strong>Solange der Schalter
        			auf „Nein“ steht, ändert sich nichts</strong> — der Shop rechnet dann wie bisher
        			Fläche × Quadratmeterpreis. Lässt man ein Feld leer, gilt der Wert aus der
        			Mappe, der im Feld grau als Vorschlag steht.<br>
        			<strong>Zahlen bitte mit Komma</strong> schreiben (1,931 · 54,63) und
        			<strong>ohne Tausenderpunkt</strong> — also „1000“, nicht „1.000“.
        		</p>
        		<table>
        			<tr>
        				<td width="260"><strong>Preisformel verwenden:</strong></td>
        				<td colspan="3">
        					<select name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_aktiv]'>
        						<option <?php if(!$this->istPreisformelAktiv()){echo "selected";}?> value="0">Nein — wie bisher (Fläche × Quadratmeterpreis)</option>
        						<option <?php if($this->istPreisformelAktiv()){echo "selected";}?> value="1">Ja — Formel aus der Excel-Mappe</option>
        					</select>
        					<span style="color:#666;">Der Schalter entscheidet allein. Alle anderen Felder wirken nur bei „Ja“.</span>
        				</td>
        			</tr>
        			<?php /* Sichtbarer Hinweis statt stillem Rueckfall: Ohne das
        			   wuerde ein Tippfehler in den Werten nur dazu fuehren, dass
        			   wieder der alte Preis gilt — ohne jede Spur. */
        			$pruefung = $this->pruefePreisformel(); ?>
        			<?php if(count($pruefung['maengel'])): ?>
        			<tr>
        				<td colspan="4" style="padding:0.5em 0;">
        					<div style="border:1px solid #c00;background:#fee;padding:0.5em;">
        						<strong style="color:#c00;">Bitte prüfen — so rechnet die Formel nicht wie gedacht:</strong>
        						<ul style="margin:0.4em 0 0 1.2em;">
        						<?php foreach($pruefung['maengel'] as $m): ?>
        							<li><?=htmlspecialchars($m)?></li>
        						<?php endforeach; ?>
        						</ul>
        					</div>
        				</td>
        			</tr>
        			<?php elseif($pruefung['probe'] and $pruefung['probe']['ok']): ?>
        			<tr>
        				<td colspan="4" style="padding:0.5em 0;">
        					<div style="border:1px solid #090;background:#efe;padding:0.5em;">
        						<strong style="color:#070;">Probe:</strong>
        						Eine Matte <?=round($pruefung['probe']['breite'])?> × <?=round($pruefung['probe']['laenge'])?> cm,
        						1 Stück, kostet mit diesen Werten
        						<strong><?=number_format($pruefung['probe']['preis'], 2, ',', '.')?> €</strong> netto.
        						<?php if(!$this->istPreisformelAktiv()): ?>
        						<span style="color:#666;">(Der Schalter steht auf „Nein“ — es gilt weiterhin der bisherige Preis.)</span>
        						<?php endif; ?>
        					</div>
        				</td>
        			</tr>
        			<?php endif; ?>
        			<tr>
        				<td width="260">EK-Listenpreis je m² in € (netto):</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_ek_qm]' value='<?=htmlspecialchars($this->get('pf_ek_qm'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('ekListenpreisProQm'))?>' /></td>
        				<td colspan="2" style="color:#666;">Preis des Lieferanten je Quadratmeter. Basis der ganzen Rechnung.</td>
        			</tr>
        			<tr>
        				<td width="260">Welcher Salesfactor gilt (Colortype):</td>
        				<td>
        					<select name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_colortype]'>
        						<?php $ct = $this->getPfColortype(); ?>
        						<option <?php if($ct==1){echo "selected";}?> value="1">1 — mehrfarbig</option>
        						<option <?php if($ct==2){echo "selected";}?> value="2">2 — einfarbig</option>
        						<option <?php if($ct==3){echo "selected";}?> value="3">3 — Ped-Print</option>
        					</select>
        				</td>
        				<td colspan="2" style="color:#666;">Bestimmt, welcher der drei Salesfactoren unten benutzt wird.</td>
        			</tr>
        			<tr>
        				<td width="260">Salesfactor mehrfarbig:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_sf_mehrfarbig]' value='<?=htmlspecialchars($this->get('pf_sf_mehrfarbig'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('salesfactorMehrfarbig'))?>' /></td>
        				<td width="200">Salesfactor einfarbig:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_sf_einfarbig]' value='<?=htmlspecialchars($this->get('pf_sf_einfarbig'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('salesfactorEinfarbig'))?>' /></td>
        			</tr>
        			<tr>
        				<td width="260">Salesfactor Ped-Print:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_sf_pedprint]' value='<?=htmlspecialchars($this->get('pf_sf_pedprint'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('salesfactorPedPrint'))?>' /></td>
        				<td colspan="2" style="color:#666;">Macht aus dem Einkauf den Verkauf. Höher = teurer.</td>
        			</tr>
        			<tr>
        				<td width="260">Standardbreiten der Rolle in cm:</td>
        				<td colspan="3"><input size='40' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_standardbreiten]' value='<?=htmlspecialchars($this->get('pf_standardbreiten'))?>' placeholder='<?=htmlspecialchars(implode(', ', $this->vorgabe('standardbreiten')))?>' />
        				<span style="color:#666;">Mit Komma trennen, z.&nbsp;B. „60, 75, 85, 115, 150, 200“. Trifft weder Breite noch Länge eine davon, greift der Sondermaß-Faktor. Der größte Wert ist zugleich die Rollenbreite.</span></td>
        			</tr>
        			<tr>
        				<td width="260">Sondermaß-Faktor:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_f_sondermass]' value='<?=htmlspecialchars($this->get('pf_f_sondermass'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('faktorSondermass'))?>' /></td>
        				<td colspan="2" style="color:#666;">1,25 bedeutet 25&nbsp;% Aufschlag, weil aus der Rolle geschnitten werden muss.</td>
        			</tr>
        			<tr>
        				<td width="260">Sonderform ohne Rand (Faktor):</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_f_form_ohne]' value='<?=htmlspecialchars($this->get('pf_f_form_ohne'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('faktorSonderformOhne'))?>' /></td>
        				<td width="200">Sonderform mit Rand (Faktor):</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_f_form_mit]' value='<?=htmlspecialchars($this->get('pf_f_form_mit'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('faktorSonderformMit'))?>' /></td>
        			</tr>
        			<tr>
        				<td width="260">Sonderfarbe Verkauf in €:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_sonderfarbe_vk]' value='<?=htmlspecialchars($this->get('pf_sonderfarbe_vk'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('aufschlagSonderfarbeVK'))?>' /></td>
        				<td width="200">Sonderfarbe Einkauf in €:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_sonderfarbe_ek]' value='<?=htmlspecialchars($this->get('pf_sonderfarbe_ek'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('aufschlagSonderfarbeEK'))?>' /></td>
        			</tr>
        			<tr>
        				<td></td>
        				<td colspan="3" style="color:#666;">Fester Betrag, der <strong>einmal je Auftrag</strong> anfällt, nicht je Stück.
        				Vorgabe ist der Mappenwert 50&nbsp;€ für den Einkauf; am 17.09.2026 waren mündlich 54&nbsp;€ genannt — bitte selbst entscheiden und hier eintragen.</td>
        			</tr>
        			<tr>
        				<td width="260">Teuerungszuschlag in Prozent:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_tz_prozent]' value='<?=htmlspecialchars($this->get('pf_tz_prozent'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('tzProzent'))?>' /></td>
        				<td colspan="2" style="color:#666;">„5“ bedeutet 5&nbsp;% Aufschlag. Wirkt nur auf den Verkauf, nie auf den Einkauf.</td>
        			</tr>
        			<tr>
        				<td width="260">Mengenstaffel:</td>
        				<td colspan="3"><input size='60' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_mengenstaffel]' value='<?=htmlspecialchars($this->get('pf_mengenstaffel'))?>' placeholder='<?=htmlspecialchars($this->getMengenstaffelVorgabeText())?>' />
        				<span style="color:#666;">Je Stufe „Stückzahl:Faktor“, mit Komma getrennt — z.&nbsp;B. „1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88“.
        				0,95 heißt 5&nbsp;% Nachlass ab dieser Stückzahl.</span></td>
        			</tr>
        			<tr>
        				<td width="260">Mindestbreite in cm:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_min_breite]' value='<?=htmlspecialchars($this->get('pf_min_breite'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('minBreite'))?>' /></td>
        				<td width="200">Maximallänge in cm:</td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_max_laenge]' value='<?=htmlspecialchars($this->get('pf_max_laenge'))?>' placeholder='<?=htmlspecialchars($this->vorgabe('maxLaenge'))?>' /></td>
        			</tr>
        			<tr>
        				<td width="260"><strong>Preis-Korrektur:</strong></td>
        				<td><input size='8' name='spezialoption[<?=$this->getArtikel()->getId()?>][spezial][pf_korrektur]' value='<?=htmlspecialchars($this->get('pf_korrektur'))?>' placeholder='leer' /></td>
        				<td colspan="2" style="color:#666;">
        					Wirkt zum Schluss auf den errechneten Preis — <strong>je Stück</strong>,
        					nicht je Auftrag. Bei 3 Matten und „+5“ kostet der Auftrag also 15&nbsp;€ mehr.<br>
        					<strong>„+5“</strong> = 5&nbsp;€ mehr &nbsp;·&nbsp; <strong>„-5“</strong> = 5&nbsp;€ weniger &nbsp;·&nbsp;
        					<strong>„+5%“</strong> = 5&nbsp;Prozent mehr &nbsp;·&nbsp; <strong>„-5%“</strong> = 5&nbsp;Prozent weniger &nbsp;·&nbsp;
        					<strong>leer</strong> = keine Korrektur.<br>
        					Würde die Korrektur den Preis auf 0&nbsp;€ oder darunter ziehen, greift sie nicht —
        					dann gilt der bisherige Preis.
        				</td>
        			</tr>
        		</table>
        		</fieldset>
			<?php
        return ob_get_clean();
    }
    
    public function getMinLaenge(){
        $desc = $this->get('minL');
        return $desc?$desc:'0';
    }
    
    public function getMaxLaenge(){
        $desc = $this->get('maxL');
        return $desc?$desc:'0';
    }
    
    public function getMinBreite(){
        $desc = $this->get('minB');
        return $desc?$desc:'0';
    }
    
    public function getMaxBreite(){
        $desc = $this->get('maxB');
        return $desc?$desc:'0';
    }
    
    public function getSpezialCalc(){
        $desc = $this->get('calc');
        return $desc?$desc:'custom';
    }
    
    
    public function getBeschreibungX(){
		$desc = $this->get('desc_x');
		return $desc?$desc:'Länge';    	
    }
    
    public function getBeschreibungY(){
    	$desc = $this->get('desc_y');
    	return $desc?$desc:'Breite';
    }
    
    public function getBeschreibung(){
        $bes = $this->get('desc');
        if(empty($bes))
            $bes = "";
        return $bes;
    }
    
    public function getEinheit(){
    	$desc = $this->get('unit');
    	return $desc?$desc:'m';
    }
    
    public function getEingabeEinheit(){
		$desc = $this->get('input_unit');
		return $desc?$desc:'cm';
    }
    
    public function getEingabeEinheitFaktor(){
        $desc = $this->get('input_unit_factor');
        return (float) ($desc?$desc:100);
    }
    
    public function getQuadratmeterPreis(){
        $desc = $this->get('input_squaremeter_price');
        return $desc?$desc:'0';
    }
    
    public function getQuadratmeterPreisBrutto(){
        $desc = $this->get('input_squaremeter_price_gross');
        return $desc?$desc:'0';
    }
    
    public function getQuadratmeterPreisEk(){
        $desc = $this->get('input_squaremeter_price_ek');
        return $desc?$desc:'0';
    }
    
    public function getQuadratmeterPreisEkBrutto(){
        $desc = $this->get('input_squaremeter_price_ek_gross');
        return $desc?$desc:'0';
    }
    
    public function getUmfangPreis(){
        $desc = $this->get('input_scope_price');
        return $desc?$desc:'0';
    }
    
    public function getUmfangPreisEk(){
        $desc = $this->get('input_scope_price_ek');
        return $desc?$desc:'0';
    }
    
    public function getUmfangPreisBrutto(){
        $desc = $this->get('input_scope_price_gross');
        return $desc?$desc:'0';
    }
    
    public function getUmfangPreisEkBrutto(){
        $desc = $this->get('input_scope_price_ek_gross');
        return $desc?$desc:'0';
    }
    
    /* ------------------------------------------------------------------
       Preisformel des Auftraggebers (Excel-Mappe)
       ------------------------------------------------------------------
       Die Werte liegen wie alle anderen in artikel.spezialoption_data.
       Ist ein Feld leer, gilt der Vorgabewert aus Preisformel::getVorgabe()
       — so wirkt ein leeres Feld nie als Null.
       ------------------------------------------------------------------ */

    /**
     * Ein einzelner Vorgabewert aus der Mappe. Wird im Admin als Platzhalter
     * angezeigt, damit der Auftraggeber sieht, was ohne Eingabe gilt.
     */
    public function vorgabe($feld){
        $v = Preisformel::getVorgabe();
        if(!isset($v[$feld])){
            return '';
        }
        /* Zahlen mit Komma zeigen — der Auftraggeber liest und schreibt
           deutsch. Gelesen wird beides (Komma und Punkt). */
        if(is_float($v[$feld])){
            return str_replace('.', ',', (string) $v[$feld]);
        }
        return $v[$feld];
    }

    /**
     * Der Schalter. Nur wenn er auf 1 steht, rechnet der Shop mit der Formel.
     * Vorgabe ist Nein — damit verhalten sich alle bestehenden Artikel
     * unveraendert.
     */
    public function istPreisformelAktiv(){
        $v = $this->get('pf_aktiv');
        return ($v === 1 or $v === '1' or $v === true);
    }

    /** Colortype des Artikels; ohne Pflege gilt die Vorgabe der Mappe. */
    public function getPfColortype(){
        $v = Preisformel::alsZahl($this->get('pf_colortype'));
        return ($v !== null and $v >= 1 and $v <= 3) ? (int) $v : (int) $this->vorgabe('colortype');
    }

    /** Die Mengenstaffel der Vorgabe als Text fuer das Admin-Feld. */
    public function getMengenstaffelVorgabeText(){
        $teile = array();
        $staffel = $this->vorgabe('mengenstaffel');
        /* Von der kleinsten Stufe aufwaerts anzeigen — so liest es sich
           wie eine Preisliste. */
        foreach(array_reverse($staffel) as $stufe){
            /* Faktor 1 ohne Nachkommastellen, alles andere zweistellig —
               "0,90" liest sich besser als "0,9". */
            $f = ($stufe['faktor'] == 1)
                ? '1'
                : str_replace('.', ',', number_format($stufe['faktor'], 2, '.', ''));
            $teile[] = $stufe['schwelle'].':'.$f;
        }
        return implode(', ', $teile);
    }

    /**
     * Liest den Text aus dem Admin-Feld "Mengenstaffel" in die Form, die
     * Preisformel erwartet: absteigend nach Schwelle sortiert, weil die
     * erste passende Stufe gewinnt.
     *
     * Erwartetes Format: "1:1, 2:0,95, 3:0,92, 10:0,90"
     *
     * Das Komma ist hier zugleich Trennzeichen zwischen den Stufen UND
     * deutsches Dezimaltrennzeichen ("0,95"). Deshalb wird NICHT am Komma
     * zerlegt, sondern jedes Paar "Zahl : Zahl" einzeln herausgesucht.
     * Sonst wuerde aus "2:0,95" die Stufe 2 mit dem Faktor 0 — und der
     * Preis stillschweigend null.
     *
     * @return array  leer, wenn nichts Brauchbares drinsteht.
     */
    public static function leseMengenstaffel($text){
        $r = self::pruefeMengenstaffel($text);
        return $r['stufen'];
    }

    /**
     * Wie leseMengenstaffel(), meldet aber zusaetzlich, was nicht gelesen
     * werden konnte. Grundlage fuer den Hinweis in der Admin-Maske.
     *
     * @return array array('stufen' => array, 'maengel' => array von Texten)
     */
    public static function pruefeMengenstaffel($text){
        $stufen  = array();
        $maengel = array();

        $text = trim((string) $text);
        if($text === ''){
            return array('stufen' => array(), 'maengel' => array());
        }

        /* Zuerst die Paare EINDEUTIG trennen, bevor das Komma als
           Dezimalzeichen gelesen wird.
           Hintergrund: Das Komma ist in diesem Feld beides — Trenner zwischen
           den Stufen UND deutsches Dezimalzeichen. Ein Ausdruck, der einfach
           "Zahl:Zahl" sucht, liest aus "1:1,2:0,95" die Stufe 1 mit dem Faktor
           1,2 (die "2" der naechsten Stufe wird zur Nachkommastelle) und
           verschluckt die Stufe 2 — ein stiller Aufschlag von 20 %.
           Deshalb wird an jedem Komma getrennt, auf das eine Zahl MIT
           Doppelpunkt folgt; nur dort beginnt wirklich eine neue Stufe.
           Semikolon und Zeilenumbruch trennen ohnehin eindeutig. */
        $vorbereitet = preg_replace('/\s*[;\n\r]+\s*/', "\x01", $text);
        /* Getrennt wird nur dort, wo vor dem Komma eine Stufe ZU ENDE ist —
           also hinter einer Zahl, der irgendwo ein Doppelpunkt vorausging.
           Ohne diese Bedingung zerfiele "1,5:0,95" in "1" und "5:0,95" und
           erfaende eine Stufe 5, die niemand eingetragen hat. */
        $vorbereitet = preg_replace('/(?<=\d),\s*(?=\d+\s*:)/', "\x02", $vorbereitet);
        /* Jetzt pruefen: steht links vom Trennpunkt ein Doppelpunkt? */
        $stuecke = explode("\x02", $vorbereitet);
        $zusammen = array();
        foreach($stuecke as $i => $st){
            if($i > 0 and strpos($zusammen[count($zusammen) - 1], ':') === false){
                /* Das vorige Stueck war keine vollstaendige Stufe — das Komma
                   gehoerte also zur Zahl, nicht zwischen zwei Stufen. */
                $zusammen[count($zusammen) - 1] .= ','.$st;
            } else {
                $zusammen[] = $st;
            }
        }
        $vorbereitet = implode("\x01", $zusammen);
        /* Ein Komma am Ende trennt nichts mehr ab — es gehoert auch nicht zur
           Zahl. Ohne diese Zeile wuerde aus "2:0,95," der Faktor 95 (das
           Komma bliebe an der Zahl haengen und machte "0,95," unlesbar bzw.
           zu 95). Dasselbe gilt fuer ein Komma direkt vor dem Satzende. */
        $vorbereitet = preg_replace('/,\s*$/', '', $vorbereitet);
        $vorbereitet = str_replace(",\x01", "\x01", $vorbereitet);
        $teile = explode("\x01", $vorbereitet);

        foreach($teile as $teil){
            $teil = trim($teil);
            if($teil === ''){
                continue;
            }
            if(strpos($teil, ':') === false){
                $maengel[] = '"'.$teil.'" ist keine Stufe — erwartet wird "Stückzahl:Faktor", z. B. "2:0,95".';
                continue;
            }
            $paar = explode(':', $teil, 2);

            /* Die Stueckzahl ist eine ganze Zahl. Steht davor noch etwas
               anderes — etwa bei "1,5:0,95", wo das Komma keine neue Stufe
               einleitet — darf daraus keine Stufe 5 erfunden werden. */
            if(!preg_match('/^\s*\d+\s*$/', $paar[0])){
                $maengel[] = 'Stufe "'.$teil.'": "'.trim($paar[0]).'" ist keine ganze Stückzahl.';
                continue;
            }

            $schwelle = Preisformel::alsZahl($paar[0]);
            $faktor   = Preisformel::alsZahl($paar[1]);

            if($schwelle === null){
                $maengel[] = '"'.trim($paar[0]).'" ist keine Stückzahl.';
                continue;
            }
            if($faktor === null){
                $maengel[] = 'Stufe "'.$teil.'": "'.trim($paar[1]).'" ist kein Faktor.';
                continue;
            }
            if($schwelle < 1 or floor($schwelle) != $schwelle){
                $maengel[] = 'Stufe "'.$teil.'": die Stückzahl muss eine ganze Zahl ab 1 sein.';
                continue;
            }
            /* Ein Faktor 0 oder darunter wuerde den Preis auf null oder ins
               Negative setzen. */
            if($faktor <= 0){
                $maengel[] = 'Stufe "'.$teil.'": der Faktor muss größer als 0 sein.';
                continue;
            }
            /* Ein Faktor ueber 1 ist kein Nachlass, sondern ein Aufschlag.
               Eine Mengenstaffel gibt Rabatt — das ist praktisch immer ein
               Tippfehler (etwa "1:100%, 2:95%", was den 100-fachen Preis
               ergaebe, oder eine verrutschte Stufe). */
            if($faktor > 1){
                $maengel[] = 'Stufe "'.$teil.'": der Faktor '.str_replace('.', ',', (string) $faktor)
                    .' ist größer als 1 und wäre ein Aufschlag statt eines Nachlasses. '
                    .'Gemeint ist vermutlich ein Wert wie 0,95 für 5 % Nachlass.';
                continue;
            }
            if(isset($stufen[(string) $schwelle])){
                $maengel[] = 'Die Stückzahl '.$schwelle.' kommt mehrfach vor.';
                continue;
            }
            $stufen[(string) $schwelle] = array('schwelle' => $schwelle, 'faktor' => $faktor);
        }

        $stufen = array_values($stufen);

        /* Fehlt die unterste Stufe, ergaenzen wir sie mit Faktor 1. In der
           Mappe ist Q6 genau das: die Stufe ohne eigenen Faktor. Ohne sie
           haette jede kleinere Menge den Preis 0,00 €. */
        if(count($stufen)){
            $kleinste = $stufen[0]['schwelle'];
            foreach($stufen as $st){
                if($st['schwelle'] < $kleinste){
                    $kleinste = $st['schwelle'];
                }
            }
            if($kleinste > 1){
                $stufen[] = array('schwelle' => 1, 'faktor' => 1);
            }
        }

        /* Absteigend nach Schwelle — Preisformel::staffelFuer nimmt die
           erste Stufe, deren Schwelle erreicht ist. */
        usort($stufen, array('SpezialoptionSpezial', 'vergleicheStufenAbsteigend'));
        return array('stufen' => $stufen, 'maengel' => $maengel);
    }

    /** Sortierhilfe fuer leseMengenstaffel (PHP 7.0 — keine Pfeilfunktion). */
    public static function vergleicheStufenAbsteigend($a, $b){
        if($a['schwelle'] == $b['schwelle']){
            return 0;
        }
        return ($a['schwelle'] < $b['schwelle']) ? 1 : -1;
    }

    /**
     * Sammelt die im Admin gepflegten Stammgroessen ein. Nur Felder, die
     * wirklich gefuellt sind, landen im Ergebnis — alles andere ergaenzt
     * Preisformel::berechne() aus der Vorgabe.
     *
     * @return array
     */
    public function getPreisformelStammdaten(){
        $st = array();

        /* Einfache Zahlenfelder: Admin-Feld => Name in Preisformel */
        $zahlen = array(
            'pf_ek_qm'            => 'ekListenpreisProQm',
            'pf_sf_mehrfarbig'    => 'salesfactorMehrfarbig',
            'pf_sf_einfarbig'     => 'salesfactorEinfarbig',
            'pf_sf_pedprint'      => 'salesfactorPedPrint',
            'pf_f_sondermass'     => 'faktorSondermass',
            'pf_f_form_ohne'      => 'faktorSonderformOhne',
            'pf_f_form_mit'       => 'faktorSonderformMit',
            'pf_sonderfarbe_vk'   => 'aufschlagSonderfarbeVK',
            'pf_sonderfarbe_ek'   => 'aufschlagSonderfarbeEK',
            'pf_tz_prozent'       => 'tzProzent',
            'pf_min_breite'       => 'minBreite',
            'pf_max_laenge'       => 'maxLaenge'
        );
        foreach($zahlen as $feld => $name){
            $z = Preisformel::alsZahl($this->get($feld));
            if($z !== null){
                $st[$name] = $z;
            }
        }

        /* Colortype — hat immer einen gueltigen Wert. */
        $st['colortype'] = $this->getPfColortype();

        /* Standardbreiten als Liste. */
        $breiten = Preisformel::alsZahlenliste($this->get('pf_standardbreiten'));
        if(count($breiten)){
            $st['standardbreiten'] = $breiten;
        }

        /* Mengenstaffel. */
        $staffel = self::leseMengenstaffel($this->get('pf_mengenstaffel'));
        if(count($staffel)){
            $st['mengenstaffel'] = $staffel;
        }

        return $st;
    }

    /**
     * Prueft die im Admin gepflegten Werte und sammelt alles ein, was nicht
     * gelesen werden konnte oder unplausibel ist.
     *
     * Warum das noetig ist: `getAufpreis()` faellt bei jedem Formelfehler auf
     * die alte Rechnung zurueck, damit nie ein Artikel ohne Preis dasteht.
     * Das ist richtig — verdeckt aber jeden Eingabefehler lautlos. Der
     * Auftraggeber saehe einen plausiblen alten Preis und wuesste nicht, dass
     * seine Formel gar nicht laeuft. Diese Pruefung macht es sichtbar; das
     * Ergebnis steht als Hinweis in der Admin-Maske.
     *
     * @return array array('maengel' => array, 'hinweise' => array, 'probe' => array|null)
     */
    public function pruefePreisformel(){
        $maengel  = array();
        $hinweise = array();

        /* --- Zahlenfelder: gefuellt, aber unlesbar? ------------------- */
        $zahlenfelder = array(
            'pf_ek_qm'          => 'EK-Listenpreis je m²',
            'pf_sf_mehrfarbig'  => 'Salesfactor mehrfarbig',
            'pf_sf_einfarbig'   => 'Salesfactor einfarbig',
            'pf_sf_pedprint'    => 'Salesfactor Ped-Print',
            'pf_f_sondermass'   => 'Sondermaß-Faktor',
            'pf_f_form_ohne'    => 'Sonderform ohne Rand',
            'pf_f_form_mit'     => 'Sonderform mit Rand',
            'pf_sonderfarbe_vk' => 'Sonderfarbe Verkauf',
            'pf_sonderfarbe_ek' => 'Sonderfarbe Einkauf',
            'pf_tz_prozent'     => 'Teuerungszuschlag',
            'pf_min_breite'     => 'Mindestbreite',
            'pf_max_laenge'     => 'Maximallänge'
        );
        foreach($zahlenfelder as $feld => $name){
            $roh = trim((string) $this->get($feld));
            if($roh === ''){
                continue;   // leer ist erlaubt, dann gilt die Vorgabe
            }
            if(Preisformel::alsZahl($roh) === null){
                $maengel[] = $name.': "'.$roh.'" ist keine Zahl. '
                    .'Gerechnet wird deshalb mit dem Vorgabewert — bitte korrigieren.';
            }
        }

        /* --- Werte ausserhalb jeder sinnvollen Spanne ----------------- */
        /*  Faengt vor allem Zahlendreher und verrutschte Kommas ab. Ein
            Salesfactor von 1931 statt 1,931 waere sonst eine gueltige Zahl,
            die den Preis stillschweigend vertausendfacht. */
        $st = $this->getPreisformelStammdaten();
        $spannen = array(
            'ekListenpreisProQm'     => array(0.01, 10000,  'EK-Listenpreis je m²', '€'),
            'salesfactorMehrfarbig'  => array(0.01,   100,  'Salesfactor mehrfarbig', ''),
            'salesfactorEinfarbig'   => array(0.01,   100,  'Salesfactor einfarbig', ''),
            'salesfactorPedPrint'    => array(0.01,   100,  'Salesfactor Ped-Print', ''),
            'faktorSondermass'       => array(0.01,    10,  'Sondermaß-Faktor', ''),
            'faktorSonderformOhne'   => array(0.01,    10,  'Sonderform ohne Rand', ''),
            'faktorSonderformMit'    => array(0.01,    10,  'Sonderform mit Rand', ''),
            'aufschlagSonderfarbeVK' => array(0,    10000,  'Sonderfarbe Verkauf', '€'),
            'aufschlagSonderfarbeEK' => array(0,    10000,  'Sonderfarbe Einkauf', '€'),
            'tzProzent'              => array(-100,  1000,  'Teuerungszuschlag', '%'),
            'minBreite'              => array(1,    10000,  'Mindestbreite', 'cm'),
            'maxLaenge'              => array(1,   100000,  'Maximallänge', 'cm')
        );
        foreach($spannen as $name => $spanne){
            if(!isset($st[$name])){
                continue;
            }
            list($min, $max, $klartext, $einheit) = $spanne;
            $wert = $st[$name];
            if($wert < $min or $wert > $max){
                $maengel[] = $klartext.': '.str_replace('.', ',', (string) $wert).' '.$einheit
                    .' liegt ausserhalb des sinnvollen Bereichs ('
                    .str_replace('.', ',', (string) $min).' bis '.str_replace('.', ',', (string) $max).'). '
                    .'Steht das Komma an der richtigen Stelle?';
            }
        }
        $sf = Preisformel::salesfactorFuer($this->getPfColortype(), array_merge(Preisformel::getVorgabe(), $st));
        if($sf <= 0){
            $maengel[] = 'Der Salesfactor für den gewählten Colortype ist '.$sf.' — damit wird jeder Verkaufspreis 0.';
        }
        if(isset($st['minBreite']) and isset($st['maxLaenge']) and $st['minBreite'] > $st['maxLaenge']){
            $maengel[] = 'Die Mindestbreite ('.$st['minBreite'].' cm) ist größer als die Maximallänge ('.$st['maxLaenge'].' cm).';
        }

        /* --- Standardbreiten ------------------------------------------ */
        $rohBreiten = trim((string) $this->get('pf_standardbreiten'));
        if($rohBreiten !== ''){
            $rb = Preisformel::leseZahlenliste($rohBreiten);
            foreach($rb['maengel'] as $m){
                $maengel[] = 'Standardbreiten: '.$m;
            }
            if(!count($rb['liste'])){
                $maengel[] = 'Standardbreiten: keine lesbare Zahl gefunden — es gelten die Vorgabewerte.';
            } else {
                $groesste = $rb['liste'][count($rb['liste']) - 1];
                if($groesste < 50){
                    $maengel[] = 'Standardbreiten: der größte Wert ist '.$groesste.' cm. '
                        .'Er gilt zugleich als Rollenbreite — damit wäre fast jede Matte "zu breit" '
                        .'und die Formel würde nicht rechnen.';
                }
            }
        }

        /* --- Mengenstaffel -------------------------------------------- */
        $rohStaffel = trim((string) $this->get('pf_mengenstaffel'));
        if($rohStaffel !== ''){
            $rs = self::pruefeMengenstaffel($rohStaffel);
            foreach($rs['maengel'] as $m){
                $maengel[] = 'Mengenstaffel: '.$m;
            }
            if(!count($rs['stufen'])){
                $maengel[] = 'Mengenstaffel: keine gültige Stufe gefunden — es gilt die Vorgabe.';
            }
        }

        /* --- Preis-Korrektur ------------------------------------------ */
        $rohK = trim((string) $this->get('pf_korrektur'));
        if($rohK !== ''){
            $probeK = Preisformel::rechneKorrektur(100.0, $rohK);
            if($probeK['grund'] !== ''){
                $maengel[] = 'Preis-Korrektur: '.$probeK['grund'];
            }
        }

        /* --- Probe-Rechnung: was kommt bei einem Beispielmaß heraus? -- */
        /*  Das ist der eigentliche Nutzen fuer den Auftraggeber: er sieht
            schwarz auf weiss, ob seine Werte rechnen — und was. */
        $probe = null;
        $faktor = $this->getEingabeEinheitFaktor();
        $laenge = $this->getX() * $faktor;
        $breite = $this->getY() * $faktor;
        if($breite > 0 and $laenge > 0){
            $r = Preisformel::berechne(
                array('breite' => $breite, 'laenge' => $laenge, 'menge' => 1),
                $st
            );
            $probe = array(
                'breite' => $breite, 'laenge' => $laenge,
                'ok' => !empty($r['ok']),
                'preis' => !empty($r['ok']) ? $r['vkGesamt'] : null,
                'grund' => !empty($r['ok']) ? '' : (isset($r['klartext']) ? $r['klartext'] : $r['grund'])
            );
            if(empty($r['ok'])){
                $maengel[] = 'Mit den aktuellen Werten rechnet die Formel nicht: '
                    .(isset($r['klartext']) ? $r['klartext'] : $r['grund'])
                    .' Solange das so ist, gilt der bisherige Preis (Fläche × Quadratmeterpreis).';
            }
        }

        return array('maengel' => $maengel, 'hinweise' => $hinweise, 'probe' => $probe);
    }

    /**
     * Rechnet die Formel fuer diesen Artikel.
     *
     * @param int   $anzahl  Stueckzahl; die Mengenstaffel haengt daran.
     * @param array $optionen  wie bei getAufpreis()
     * @return array  Ergebnis von Preisformel::berechne()
     */
    public function berechnePreisformel($anzahl = 1, $optionen = array()){
        /* Rechenart "umf" (Umfang) passt nicht zur Formel: dort ist der Preis
           ein Preis je Laufmeter Umrandung, waehrend die Mappe mit Breite ×
           Laenge rechnet. Statt stillschweigend etwas Falsches auszurechnen,
           wird hier abgebrochen — getAufpreis() nimmt dann die bisherige
           Umfangs-Rechnung. (Heute nutzt kein Artikel "umf"; die Weiche steht
           fuer den Fall, dass einer dazukommt.) */
        if($this->getSpezialCalc() == 'umf'){
            return array(
                'ok' => false, 'code' => 'RECHENART_UMF',
                'grund' => 'Die Preisformel rechnet mit Breite × Länge, die Rechenart "Umfang" nicht.',
                'klartext' => 'Für die Rechenart „Umfang" greift die Preisformel nicht. '
                    .'Es gilt weiterhin der Preis je Länge.'
            );
        }

        $faktor = $this->getEingabeEinheitFaktor();

        /* x und y liegen intern in Metern (geteilt durch den
           Umrechnungsfaktor). Die Formel rechnet in Zentimetern, also
           zurueckrechnen.

           Gerundet wird dabei auf hundertstel Millimeter. Grund: 115 cm
           liegen intern als 1,15 m, und 1,15 · 100 ergibt im Gleitkomma
           114,99999999999998… Ohne das Runden gaelte eine 115er Matte nicht
           mehr als Standardbreite und kostete 25 % Sondermass-Aufschlag.
           60, 75, 85, 150 und 200 sind zufaellig exakt darstellbar — 114,
           115 und 116 nicht. */
        $laenge = round($this->getX() * $faktor, 4);
        $breite = round($this->getY() * $faktor, 4);

        $eingaben = array(
            'breite' => $breite,
            'laenge' => $laenge,
            'menge'  => $anzahl > 0 ? $anzahl : 1
        );

        /* Sonderform und Sonderfarbe kommen aus der Kundenanfrage. Das
           Altsystem hat dafuer heute keine Eingabefelder; die Werte werden
           hier gelesen, falls sie gesetzt sind, damit die Bruecke und
           spaetere Felder sie durchreichen koennen. */
        foreach(array('sonderformOhneRand' => 'sf_ohne',
                      'sonderformMitRand'  => 'sf_mit',
                      'sonderfarbe'        => 'sonderfarbe',
                      'sonderfarbenAnzahl' => 'sonderfarben_anzahl') as $name => $feld){
            $v = $this->get($feld);
            if($v !== false and $v !== ''){
                $eingaben[$name] = $v;
            }
        }

        return Preisformel::berechne($eingaben, $this->getPreisformelStammdaten());
    }

    public function getX(){
		$v = $this->get('x');
		if($v==='' or $v===false){
			return $this->getXDefault();
		}
		$stellen = strlen(abs($this->getEingabeEinheitFaktor())) - 1;
		$stellen = max(2,$stellen);
    	return round((float) str_replace(',','.',$v),$stellen);
    }
    
    public function getY(){
		$v = $this->get('y');
		if($v==='' or $v===false){
			return $this->getYDefault();
		}
		$stellen = strlen(abs($this->getEingabeEinheitFaktor())) - 1;
		$stellen = max(2,$stellen);
		return round((float) str_replace(',','.',$v),$stellen);
    }

    public function getXInputDefault(){
    	return $this->getXDefault() * $this->getEingabeEinheitFaktor();
    }
    
    public function getYInputDefault(){
    	return $this->getYDefault() * $this->getEingabeEinheitFaktor();
    }
    
    public function getXDefault(){
    	return 1;
    }
    
    public function getYDefault(){
    	return 1;
    }
    
    
    public function getDescriptionText(Sprache $sprache=null){
		$faktor = $this->getEingabeEinheitFaktor();
        return $this->getBeschreibung().": ".round($this->getX()*$faktor,1).$this->getEingabeEinheit()." × ".round($this->getY()*$faktor,1).$this->getEingabeEinheit();
    }
    
    public function getAdminDescriptionText(){
		$faktor = $this->getEingabeEinheitFaktor();
		
		$bx=$this->getBeschreibungX();
		$by=$this->getBeschreibungY();
		$bx = $bx?' '.$bx:'';
		$by = $by?' '.$by:'';
		
		return $this->getBeschreibung().": ".round($this->getX()*$faktor,1).$this->getEingabeEinheit().$bx." × ".round($this->getY()*$faktor,1).$this->getEingabeEinheit().$by;
    }
    
    
    public function set($code, $value){
        parent::set($code, $value);
        if($this->getArtikel()){
            $this->getArtikel()->set('spezialoption_data', serialize($this));
        }
    }
    
    
    public function parseAdminPost(){
        if(empty($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial']))
            return;
            $fields = array('calc', 'unit', 'desc_x', 'desc_y', 'desc', 'input_unit', 'input_unit_factor','maxL','minL','maxB','minB','input_squaremeter_price','input_squaremeter_price_gross','input_squaremeter_price_ek','input_squaremeter_price_ek_gross','input_scope_price','input_scope_price_gross',
                /* Preisformel des Auftraggebers — werden wie alle anderen
                   Felder in artikel.spezialoption_data abgelegt. */
                'pf_aktiv','pf_ek_qm','pf_colortype','pf_sf_mehrfarbig','pf_sf_einfarbig','pf_sf_pedprint',
                'pf_standardbreiten','pf_f_sondermass','pf_f_form_ohne','pf_f_form_mit',
                'pf_sonderfarbe_vk','pf_sonderfarbe_ek','pf_tz_prozent','pf_mengenstaffel',
                'pf_min_breite','pf_max_laenge','pf_korrektur');
        
        foreach($fields as $field){
            if(isset($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial'][$field])){
                $value = strip_tags($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial'][$field]);
                $this->set($field, $value);
            }
        }
    }
    
    public function parseFrontendPost(){
        if(empty($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial']))
            return;
        $fields = array('x', 'y');
        
        foreach($fields as $field){
            if(isset($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial'][$field])){
                $value = strip_tags($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial'][$field]);
                switch($field){
                	case 'x':
                	case 'y':
                		$value = $value / $this->getEingabeEinheitFaktor();
                }
                $this->set($field, $value);
            }
        }
        $exp = false;
        if($this->getX() <= 0){
        	// $this->set('x', 1);
        	$exp = true;
        }
        if($this->getY() <= 0){
        	// $this->set('y', 1);
        	$exp = true;
        }
        if($exp){
        	throw new Exception("Bitte geben Sie eine gültige Fläche an.");
        }
    }
    
    public function getFlaeche(){
        
        if($this->getSpezialCalc() == "umf"){
            $varLength = $this->getX();
            $varWidth = $this->getY();
            $scope = ($varLength * 2) +($varWidth * 2);
            return $scope;
        }else{
    	   return $this->getX() * $this->getY();
        }
    }
    
    /**
     * @param array $optionen  'lieferantenpreis' => 1 fuer den Einkaufspreis
     * @param int   $anzahl    Stueckzahl. Vorgabe 1, damit jeder bestehende
     *                         Aufruf (Spezialoption::getAufpreis() kennt den
     *                         Parameter nicht) unveraendert weiterarbeitet.
     *                         Nur die Preisformel wertet ihn aus — die alte
     *                         Rechnung unten ist mengenunabhaengig.
     */
    public function getAufpreis($optionen=array(), $anzahl=1){
		$artikel = $this->getArtikel();
		$qm_preis = $this->getFlaeche();

		if(!$qm_preis){
		    return 0;
		}

		/* --------------------------------------------------------------
		   Preisformel des Auftraggebers.
		   Greift NUR, wenn der Schalter im Admin auf "Ja" steht. Sonst
		   laeuft unveraendert die bisherige Rechnung weiter.
		   Liefert die Formel einen Fehler (zu schmal, zu breit, zu lang)
		   oder fehlen Werte, faellt die Rechnung ebenfalls auf das
		   bisherige Verhalten zurueck — ein Artikel soll nie ohne Preis
		   dastehen.
		   -------------------------------------------------------------- */
		if($this->istPreisformelAktiv()){
		    $r = $this->berechnePreisformel($anzahl, $optionen);
		    if(!empty($r['ok'])){
		        /* Die Formel liefert einen Gesamtpreis fuer die Menge. Der
		           Shop erwartet hier den Preis EINES Stuecks, weil er ihn
		           spaeter mit der Menge multipliziert. Deshalb der
		           Stueckanteil: der Sonderfarbenaufschlag faellt nur einmal
		           je Auftrag an und steckt in vkGesamt, nicht im Stueckpreis. */
		        $menge = $anzahl > 0 ? $anzahl : 1;
		        if(empty($optionen['lieferantenpreis'])){
		            $gesamt = $r['vkGesamt'];
		            /* Mit DERSELBEN Menge abziehen, mit der der Aufrufer den
		               Basispreis addiert: Artikel::getPreis($menge) nimmt ab
		               Menge 2 den Wert aus der bestehenden Preisstaffel
		               (artikel_preisstaffeln). Zoege man hier den Preis fuer
		               ein Stueck ab, bliebe die Differenz als zusaetzlicher
		               Rabatt im Ergebnis stehen — die Preisformel wuerde
		               still mit der alten Staffel doppelt rabattieren. */
		            $basis  = $artikel->getBasisPreis($menge);
		        } else {
		            $gesamt = $r['ekGesamt'];
		            $basis  = $artikel->getBasisLieferantenPreis();
		        }
		        $je_stueck = $gesamt / $menge;

		        /* Preis-Korrektur des Auftraggebers zum Schluss.
		           Zoege sie den Preis auf 0 oder darunter (etwa "-200" statt
		           "-20"), gilt das wie jeder andere Formelfehler: zurueck auf
		           die alte Rechnung, statt eine Matte zu verschenken. */
		        $k = Preisformel::rechneKorrektur($je_stueck, $this->get('pf_korrektur'));
		        if(!empty($k['ok'])){
		            $je_stueck = $k['preis'];

		            /* Letzte Sicherung: was hier zurueckgeht, wird zum
		               Artikelpreis. Null oder negativ darf es nie sein. */
		            if(is_finite($je_stueck) and $je_stueck > 0){
		                /* getAufpreis() liefert die Differenz zum Basispreis, weil
		                   der Aufrufer den Basispreis schon addiert hat. */
		                return -1 * $basis + $je_stueck;
		            }
		        }
		    }
		}

		if($this->getSpezialCalc() == "umf"){
		    if(empty($optionen['lieferantenpreis'])){
		        return -1 * $artikel->getBasisPreis() + $this->getFlaeche() * $this->getUmfangPreis();
		        
		    } else {
		        return -1 * $artikel->getBasisLieferantenPreis() + $this->getFlaeche() * $this->getUmfangPreisEk();
		        
		    }
		}else{
    		if(empty($optionen['lieferantenpreis'])){
    		    return -1 * $artikel->getBasisPreis() + $this->getFlaeche() * $this->getQuadratmeterPreis();
    		} else {
    		    return -1 * $artikel->getBasisLieferantenPreis() + $this->getFlaeche() * $this->getQuadratmeterPreisEk();
    		}
		}
    }
    
    public function getZusatzGewicht($optionen=array()){
    	$artikel = $this->getArtikel();
		return $artikel->getGewichtOhneOptionen() * ($this->getFlaeche() - 1);
    }
    
}