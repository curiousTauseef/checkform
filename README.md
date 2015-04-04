#Checkform


* richiede jquery
* richiede momentjs per l'analisi delle date (http://momentjs.com)

##Funzionalità
* aggiunge un fallback alla validazione di base html5, aggiungendo propri controlli per i browser meno recenti
* permette l'attivazione di controlli incrociati basati sull'interazione di diversi elementi del form
* gli errori vengono visualizzati tramite un div generato sotto ogni campo con errore
* i campi con attributo disabled non vengono controllati

* Il controllo viene eseguito sulla base del tipo di elemento input utilizzato:
 	* date
	* time
	* datetime e datetime-local
	* number
	* email
	* tel
	* url

* Vengono inoltre verificati eventuali attributi aggiuntivi:
	* required 
	* min e max
	* pattern 

* Ulteriori controlli possono essere eseguiti utilizzando l'attributo data-cf_extra:
	* tel_it (telefoni fissi italiani: primo numero 0, 1, 8 o +)
	* cell_it (cellulari italiani: primo numero 3 o +)
	* iban_it (iban italiano)
	* cf_it (codice fiscale italiano)
	* vat_it (partita iva italiana)
	
* controllo extra per la lunghezza minima delle stringhe con l'attributo `data-cf_minlength="_num_"`
	(NB: il controllo `maxlength` è già un attributo standard html)

* controllo per gruppo di checkbox e almeno una selezione obbligatoria: si attiva assegnando al contenitore la classe `cf_checkbox_group`

* È possibile scrivere un codice di validazione ad hoc utilizzando le proprietà `pre_check` e `extra_check` (pre_check viene eseguita prima dei controlli standard, extra_check dopo)

* Dopo il controllo, al form viene assegnato il valore data `cf_valid` _true_ o _false_ in base all'esito

* Se l'esito è positivo, il pulsante `Submit` viene disabilitato e viene visualizzata la stringa definita in `disabled_submit_label`. 
Il pulsante Submit può essere indicato esplicitamente con l'opzione `submit_button` (deve essere un oggetto jquery) 
in caso contrario (il valore di default è `null`) viene identificato automaticamente nel form.


##Utilizzo

	$(document).ready(function(){
	
		// aggiunge automaticamente il gestore eventi onsubmit
		$('#form_id').cf();
		
    });


Per controlli aggiuntivi o per aggiungere procedure ad hoc, si può testare il valore `data.cf_valid` assegnato al form durante la validazione:
    
    $(document).ready(function(){
        $('#form_id').cf().submit(function (event) {
            
            event.preventDefault();
            
            if($('form_id').data('cf_valid')) {
                ...
            }
        });
		
    });
    

È possibile richiamare il controllo form anche senza il trigger del submit chiamando direttamente la funzione di controllo:

	$('#form_id').cf().cf('checkform');
	if($('form_id').data('cf_valid')) {
            ...
    }

Il primo `cf()` istanzia il plugin, il secondo chiama la funzione `checkform` che esegue la validazione.


Parametri:
--

* **`disable_submit`**: (boolean, default: `true`) disabilita il pulsante submit se la validazione è superata

* **`submit_button`**: (elemento JQuery, default: `null`) pulsante submit. Se non indicato viene identificato automaticamente (il primo pulsante o input di tipo *submit* rilevato nel form)

* **`disabled_submit_label`**: (stringa, default: `Operazione in corso... Attendere`) testo del pulsante label dopo la disabilitazione. Il testo originale del pulsante viene salvato in `data('original_label')`

* **`container`**: (stringa, default: `.form-group`) elemento posto intorno ad ogni ogni campo del form (e relativi label ecc.). Il default è lo standard di Bootstrap 3

* **`error_class`**: (stringa, default: `has-error`, classe alert di errore di bootstrap 3, richiede il modulo alert.js di Bootstrap) la classe che viene assegnata all'elemento contenitore del campo in caso di validazione non superata

* **`error_mes_template`**: markup per la visualizzazione dei messaggi d'errore. Deve avere la classe `cf_error_mes` (per l'identificazione e la rimozione dei messaggi) e deve contenere il segnaposto `@@error_mes@@` che sarà sostituito con il messaggio errore

* **`error_alert`**: (boolean, default: `true`) aggiunge un alert in caso di errore

* **`error_alert_mes`**: (stringa, default: `Sono stati rilevati degli errori`) Messaggio di errore visualizzato nell'alert (se abilitato)

* **`pre_check`**: (funzione, default: null) funzione extra eseguita prima del controllo vero e proprio utilizzato per assegnare eventuali vincoli extra condizionali non restituisce nulla

* **`extra_check`**: (funzione, default: null) funzione extra per controlli non standard. Deve restituire un array di messaggi di errore che vengono riportati sopra il pulsante submit. Viene eseguita dopo i controlli standard. Se non vengono rilevati errori deve restituire un array vuoto.


		$('#form_id').cf({
			'extra_check': function () {
				
				var esito=[];

				if(__test__) {
		
					esito.push("messaggio");
				}
	
				return esito;
			}
		});


* **`extra_check_wrapper_class`**: (stringa, default: `cf_extra_check_wrapper`) classe assegnata al div che contiene i messaggi di errore generati dal controllo extra_check

* **`post_check`**: (funzione, default: null) funzione extra eseguita dopo il controllo e dopo l'eventuale assegnazione delle classi di errore. Va usato per compiere eventuali azioni legate all'esito finale del controllo (ad esempio aprire un collapse di bootstrap):

		post_check: function () {
			if(_form_offerta.find(':invalid, .has_error').length) {

				_form_offerta.find(':invalid').each( function() {
					$(this).parent().addClass('has-error');
				});
				
				_form_offerta.find(':invalid, .has_error').eq(0).parents('.collapse').eq(0).collapse('show');
			}
			
		}
	

* **`disable_cf_on_cbox_id`**: (stringa, default: `cancellato`) id del checkbox che, se selezionato, non fa partire il controllo del form (visto che il record viene cancellato)


##Credits
Massimo Cassandro (2007-2014).

Questo plugin è stato costruito utilizzando jQuery lightweight plugin boilerplate (http://jqueryboilerplate.com/)