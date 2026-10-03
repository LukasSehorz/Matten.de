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
            $fields = array('calc', 'unit', 'desc_x', 'desc_y', 'desc', 'input_unit', 'input_unit_factor','maxL','minL','maxB','minB','input_squaremeter_price','input_squaremeter_price_gross','input_squaremeter_price_ek','input_squaremeter_price_ek_gross','input_scope_price','input_scope_price_gross');
        
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
    
    public function getAufpreis($optionen=array()){
		$artikel = $this->getArtikel();
		$qm_preis = $this->getFlaeche();

		if(!$qm_preis){
		    return 0;
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