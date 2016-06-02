/* jshint devel: true */
/* globals moment */
//* exported */

/*@license
 * CHECKFORM 5 - novembre 2013
 * 5.1: introdotta compatibilita con indirizzi mail con carattere `+` (es `myemail+label@gmail.com`)
 * Massimo Cassandro
 */


;(function ( $, window, document, undefined ) {

    // the semi-colon before the function invocation is a safety
    // net against concatenated scripts and/or other plugins
    // that are not closed properly.

    // undefined is used here as the undefined global
    // variable in ECMAScript 3 and is mutable (i.e. it can
    // be changed by someone else). undefined isn't really
    // being passed in so we can ensure that its value is
    // truly undefined. In ES5, undefined can no longer be
    // modified.

    // window and document are passed through as local
    // variables rather than as globals, because this (slightly)
    // quickens the resolution process and can be more
    // efficiently minified (especially when both are
    // regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "cf",
        defaults = {
            disable_submit              : true,
            submit_button               : null,
            disabled_submit_label       : 'Operazione in corso... Attendere',
            container                   : '.form-group', // boostrap standard
            error_class                 : 'has-error', // bootstrap 3 error class
            error_mes_template          : '<div class="alert alert-danger alert-dismissable cf_error_mes">'+
                                            '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                                            '@@error_mes@@'+
                                            '</div>',
            error_alert                 : true,
            error_alert_mes             : 'Sono stati rilevati degli errori',
            extra_check_wrapper_class   : 'cf_extra_check_wrapper',
            extra_check                 : null,
            pre_check                   : null,
            post_check                  : null,
            disable_cf_on_cbox_id       : 'cancellato',
            no_label                    : false

        };

    var mailRegExp=/^[\w\._=\-\+]+@[\w\.-]+\.[a-zA-Z]{2,6}$/,

        cf_err_mes = { // messaggi di Errore
            generico            : 'Il valore inserito non corrisponde ai requisiti richiesti',

            required            : 'Questo valore \u00E8 obbligatorio',
            email               : 'L\'indirizzo email inserito non \u00E8 valido',
            email_multiple      : 'Uno o pi\u00F9 indirizzi email non sono corretti',
            number              : 'Il valore inserito non \u00E8 un numero',
            date                : 'Il valore inserito non \u00E8 una data corretta (la data va inserita nella forma gg/mm/aaaa)',
            time                : 'Il valore inserito non \u00E8 corretto (gli orari vanno inseriti nella forma hh:mm)',
            datetime            : 'Il valore inserito non \u00E8 corretto (date e ore vanno inserite nella forma gg/mm/aaaa hh:mm)',
            url                 : 'Il valore inserito non \u00E8 un indirizzo web corretto',
            tel                 : 'Il valore inserito non \u00E8 un numero di telefono fisso valido',

            cell                : 'Il valore inserito non \u00E8 un numero di cellulare valido',

            min                 : 'Il valore inserito \u00E8 pi\u00F9 piccolo del minimo consentito',
            max                 : 'Il valore inserito \u00E8 pi\u00F9 grande del massimo consentito',

            minlength           : '\u00C8 necessario inserire almeno @@minlength@@ caratteri',
            iban                : 'Il codice IBAN inserito non \u00E8 corretto',
            codice_fiscale      : 'Il valore inserito non \u00E8 corretto',
            partita_iva         : 'Il valore inserito non \u00E8 corretto',

            checkbox_group      : "\u00C8 necessario selezionare almeno un'opzione"

        };


    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method that merges the
        // contents of two or more objects, storing the
        // result in the first object. The first object
        // is generally empty because we don't want to alter
        // the default options for future instances of the plugin

        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).


            // controllo tag

            if(this.element.tagName !== 'FORM') {
                this.options.disable_submit=false;
            }

            $(this.element).submit(this, function (event) {

                return event.data.checkform();

            });

        },


        checkform: function() {

            var _cf=this,
                _form=this.element,
                cf_opts = this.options,
                is_err=false;

            // rimuove errori rilevati precedentemente
            $(_form).find('.' + cf_opts.error_class).each(function() {$(this).removeClass(cf_opts.error_class);});
            $(_form).find('.cf_error_mes').remove();
            $(_form).removeData('cf_valid');


            // pulsante submit: se null viene impostato con il primo elemento type=submit trovato
            if(cf_opts.submit_button === null && $(_form).find('[type="submit"]').length) {

                cf_opts.submit_button=$(_form).find('[type="submit"]').eq(0);
            }


            // controllo eventuale esistenza cbox elimina selezionato e conseguente soppressione del controllo
            if(cf_opts.disable_cf_on_cbox_id !=='' &&
                $('#' + cf_opts.disable_cf_on_cbox_id).length &&
                $('#' + cf_opts.disable_cf_on_cbox_id).is(':checkbox') &&
                $('#' + cf_opts.disable_cf_on_cbox_id).prop('checked')
            ) {
                $(_form).data('cf_valid', true);
                return true;
            }

            // pre check
            if(cf_opts.pre_check !== null) { cf_opts.pre_check(); }

            // controllo: selezione dei campi
            $(_form).find('input, select, textarea').not(':disabled').each(function() {

                var _this_mes=[],
                    _this_field=$(this),
                    _val=$.trim(_this_field.val()),
                    _cf_extra=null,
                    _type=null,
                    _data=_this_field.data();

                if(_this_field[0].tagName==='INPUT') {
                    _type=_this_field.attr('type').toLowerCase();
                }

                if (_data.cf_extra!=="undefined") {
                    _cf_extra=$.trim(_data.cf_extra);
                }


                // controllo required

                if(_this_field.prop('required') && ((_this_field.is(':checkbox') && !_this_field.is(':checked')) || (_val === ''))) {
                    _this_mes.push(cf_err_mes.required);
                }


                if(_val !== '') {

                    if(_type==='email') {

                        if(_this_field.is('[multiple]')) {

                            $.each(_val.split(','), function(idx, email) {
                                if(!mailRegExp.test($.trim(email))) {
                                    _this_mes.push(cf_err_mes.email_multiple);
                                    return false; // break loop
                                }
                            });

                        } else {
                            if(!mailRegExp.test(_val)) { _this_mes.push(cf_err_mes.email); }
                        }


                    /*
                    } else if(_type==='date') {

                        if(!_cf.cf_check_data(_val)) _this_mes.push(cf_err_mes.date);

                    } else if(_type==='datetime' || _type==='datetime-local') {

                        temp=_val.split(' ', 2);
                        if(_val.length !== 16 || temp[0]===null || temp[1]===null || !_cf.cf_check_data(temp[0]) || !_cf.cf_check_ora(temp[1])) {
                            _this_mes.push(cf_err_mes.datetime);
                        }
                    */

                    } else if(_type==='date' || _type==='datetime' || _type==='datetime-local') {

                        if(!_cf.cf_parseDate(_val).isValid()) { _this_mes.push(_type==='date'? cf_err_mes.date : cf_err_mes.datetime); }

                    } else if(_type==='time') {

                        //if(!_cf.cf_check_ora(_val)) _this_mes.push(cf_err_mes.time);

                        if(!moment(_val, "hh:mm").isValid()) { _this_mes.push(cf_err_mes.time); }


                    } else if(_type==='number' || _type==='range') {

                        if( isNaN(_val) || !/^[+\-]?\d+(\.\d+)?$/.test(_val)) {
                            _this_mes.push(cf_err_mes.number);
                        } else {
                            _val=Number(_val);
                        }

                    } else if(_type==='tel' ) {

                        if(_cf_extra === 'tel_it') {

                            if(/[^0-9\+]/g.test(_val) || !/^[0|1|8|\+]/.test(_val) ) {
                                _this_mes.push(cf_err_mes.tel);
                            }

                        } else if(_cf_extra === 'cell_it') {

                            if(/[^0-9\+]/g.test(_val) || !/^[3|\+]/.test(_val) ) {
                                _this_mes.push(cf_err_mes.cell);
                            }

                        } else {

                            if(/[^0-9\+]/g.test(_val) ) {
                                _this_mes.push(cf_err_mes.tel);
                            }
                        }

                    } else if(_type==='url' ) {
                        var urlregexp=/^https?:\/\/(([a-z]([a-z0-9\-]*)\.)+([a-z]{2,6})|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*\/?(\?([a-z0-9+_\-\.%=&amp;])*)?(#[a-z][a-z0-9_]*)?$/i;
                        if(!urlregexp.test(_val)) {
                            _this_mes.push(cf_err_mes.url);
                        }
                    }


                    if(!_this_mes.length) { // questi controlli non vengono eseguiti se sono già presenti errori, per evitare messaggi di errore imprecisi


                        // controllo minlength
                        if(_data.cf_minlength!=="undefined") {

                            if(_val.length < _data.cf_minlength) {
                                _this_mes.push(cf_err_mes.minlength.replace(/@@minlength@@/, _data.cf_minlength));
                            }
                        }

                        // controllo pattern
                        if(_this_field.attr('pattern')) {

                            var pattern_regexp = new RegExp(_this_field.attr('pattern'));

                            if(!pattern_regexp.test(_val)) { _this_mes.push(cf_err_mes.generico); }
                        }


                        // controllo min
                        if (_this_field.attr('min')) {
                            var _min=$.trim(_this_field.attr('min'));
                            if(_type==='number' || _type==='range') {
                                _min=Number(_min);
                            }

                            if(_type==="date" || _type==="datetime" || _type==="datetime-local") {

                                if(_cf.cf_parseDate(_val) < _cf.cf_parseDate(_min)) {_this_mes.push(cf_err_mes.min);}

                            } else {
                                if(_val < _min) {_this_mes.push(cf_err_mes.min);}
                            }

                        }

                        // controllo max
                        if (_this_field.attr('max')) {
                            var _max=$.trim(_this_field.attr('max'));
                            if(_type==='number' || _type==='range') {
                                _max=Number(_max);
                            }

                            if(_type==="date" || _type==="datetime" || _type==="datetime-local") {

                                if(_cf.cf_parseDate(_val) > _cf.cf_parseDate(_max)) {_this_mes.push(cf_err_mes.max);}

                            } else {
                                if(_val > _max) {_this_mes.push(cf_err_mes.max);}
                            }
                        }
                    }


                    var esito, i;
                    // controllo tipi speciali:
                    if(_type==="text" && _cf_extra==='cf_it') {

                        var validi, s, set1, set2, setpari, setdisp,
                            cf = _val.toUpperCase();

                        esito=true;

                        if( cf.length !== 16 ) {esito=false;}
                        validi = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                        for( i = 0; i < 16; i++ ) {if( validi.indexOf( cf.charAt(i) ) === -1 ) {esito=false;}}

                        set1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                        set2 = "ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ";
                        setpari = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                        setdisp = "BAKPLCQDREVOSFTGUHMINJWZYX";
                        s = 0;
                        for( i = 1; i <= 13; i += 2 ) {s += setpari.indexOf( set2.charAt( set1.indexOf( cf.charAt(i) )));}
                        for( i = 0; i <= 14; i += 2 ) {s += setdisp.indexOf( set2.charAt( set1.indexOf( cf.charAt(i) )));}

                        if( s%26 !== cf.charCodeAt(15)-'A'.charCodeAt(0) ) {esito=false;}

                        if(!esito) {
                            if(!_cf.cf_partita_iva(cf)) {_this_mes.push(cf_err_mes.codice_fiscale);}
                        }


                    } else if (_type==="text" && _cf_extra==='vat_it') {
                        if(!_cf.cf_partita_iva(_val)) {_this_mes.push(cf_err_mes.partita_iva);}

                    /* !IBAN */
                    } else if (_type==="text" && _cf_extra==='iban_it') {

                        var iban=_val.toUpperCase(),
                            paese=iban.substring(0,2);

                        esito=true;

                        if(paese==='IT' && iban.length===27) {

                            var cineur=iban.substring(2,4),
                                cin=iban.substring(4,5),
                                abi=iban.substring(5,10),
                                cab=iban.substring(10,15),
                                cc=iban.substring(15);

                            if(!cineur || isNaN(cineur)) { // Il codice CIN EUR deve essere un numero di due cifre
                                esito = false;

                            } else if(!cin || /[^A-Z]/.test(cin)) { // Il codice CIN deve essere una lettera maiuscola
                                esito = false;

                            } else if(!abi || isNaN(abi)) { // Il codice ABI deve essere un numero di cinque cifre
                                esito = false;

                            } else if(!cab || isNaN(cab) ) { // Il codice CAB deve essere un numero di cinque cifre
                                esito = false;

                            } else if(!cc || /[^A-Z0-9]/.test(cc) || cc.length>12) { // Il numero di conto deve essere composto da numeri o lettere alfabetiche maiuscole ed essere composto da 12 cifre
                                esito = false;
                            }

                            // verifica checkdigit CIN EUR
                            if(esito) {
                                // spostamento delle prime 4 cifre in fondo alla stringa
                                var check=iban.substring(4)+iban.substring(0,4);

                                //trasformazione delle lettere in numeri: A=10 (ASCII A=65, i numeri sono tra 48 e 57)
                                var check_num='', c;
                                for (i = 0; i < check.length; i++ ) {
                                    c = check.charCodeAt(i);
                                    if(c>=65) {
                                        c=c-55;
                                    } else {
                                        c=check.charAt(i);
                                    }
                                    check_num+=String(c);
                                }

                                // divisione di check_num in parti di 8 cifre e controllo
                                var resto='';
                                for(i=0; i<check_num.length; i=i+8) {
                                    resto=Number(String(resto)+String(check_num.substr(i,8))) % 97;
                                }

                                if(resto !==1) {
                                    esito = false;
                                }
                            }
                        } else {
                            esito = false;
                        }

                        if(!esito) {_this_mes.push(cf_err_mes.iban);}

                    } // end iban



                } // end if(_val !== '')


                if(_this_mes.length) {

                    _this_field.closest(cf_opts.container).addClass(cf_opts.error_class)
                        .append(cf_opts.error_mes_template.replace(/@@error_mes@@/, _this_mes.join('<br>')));

                    is_err=true;
                }

            }); // end each

            /* !checkbox_group */
            // gruppo checkbox o radio (almeno uno deve essere selezionato)
            // si attiva assegnando al contenitore la classe "cf_checkbox_group"
            $('.cf_checkbox_group').each(function() {
                var _this=$(this);
                if(_this.find('input:checked').length === 0) {
                    _this.addClass(cf_opts.error_class)
                    .append(cf_opts.error_mes_template.replace(/@@error_mes@@/, cf_err_mes.checkbox_group));
                }

            });


            /* !extra_check */
            /*
            Se presente, extra_check è una funzione che esegue controlli extra non standard e restituisce un array di messaggi di errore
            (oppure un array vuoto se il check ha risultato negativo)
            I messaggi vengono stampati sopra il pulsante di Submit (e' necessario sia identificabile) oppure sopra il form
            */

            if(cf_opts.extra_check !== null && cf_opts.extra_check().length) { //} !== [] && cf_opts.extra_check() !== null) {

                var extra_check_mes='<div class="' + cf_opts.extra_check_wrapper_class + '">' + cf_opts.error_mes_template.replace(/@@error_mes@@/, cf_opts.extra_check().join('<br>')) + '</div>';

                if($(_form).find(cf_opts.submit_button).length) {
                    cf_opts.submit_button.before(extra_check_mes);
                } else {
                    $(_form).prepend(extra_check_mes);
                }

                is_err=true;
            }



            /* !submit */
            if(is_err) {

                $(_form).data('cf_valid', false);

                $('.' + cf_opts.error_class).eq(0).focus();

                // !post check
                if(cf_opts.post_check !== null) { cf_opts.post_check(); }


                if(cf_opts.error_alert) { window.alert(cf_opts.error_alert_mes);}
                return false;

            } else {

                if(cf_opts.disable_submit && cf_opts.submit_button && cf_opts.disabled_submit_label && $(_form).find(cf_opts.submit_button).length>0) {

                    var original_label;

                    // aggiunge un valore hidden con lo stesso name e lo stesso value  del submit disabilitato
                    if(!$('input:hidden[name="' + cf_opts.submit_button.attr('name') + '"]').length) {
                        cf_opts.submit_button.after('<input type="hidden" name="'+ cf_opts.submit_button.attr('name') +'" value="'+ cf_opts.submit_button.val() + '">');
					}
                    // disabilita il pulsante
                    cf_opts.submit_button.attr("disabled", "disabled");

                    // cambia l'etichetta e aggiunge un data con l'etichetta originale del submit in caso di necessità di ripristino (per submit ajax)
                    if(cf_opts.submit_button.is('input')) {
                        original_label=cf_opts.submit_button.val();
                        cf_opts.submit_button.val(cf_opts.disabled_submit_label);

                    } else { // button
                        original_label=cf_opts.submit_button.html();
                        cf_opts.submit_button.html(cf_opts.disabled_submit_label);
                    }

                    cf_opts.submit_button.data("original_label", original_label);
                }

                $(_form).data('cf_valid', true);

                return true;
            }

        }, // end checkform

        /*
        // controllo data senza uso di moment js
        cf_check_data: function(str) {


            var _sep='/',
                idx_year=2,
                idx_day=0;

            if(is_Modernizr && !Modernizr.inputtypes.date) { // se il browser supporta il tipo date, la data e' in formato ISO (yyyy-mm-dd)
                _sep='-';
                idx_year=0;
                idx_day=2;
            }

            if(str.indexOf(_sep) === -1 || str.length > 10) {
                return false;
            } else {
                var dta=str.split(_sep);

                if( dta.length < 3 || dta[0]==='' || dta[1]==='' || dta[2]==='' ||
                    dta[0]===null || dta[1]===null || dta[2]===null ||
                    isNaN(dta[0]) || isNaN(dta[1])  || isNaN(dta[2]) ||
                    dta[idx_year].length<4 ) {

                    return false;

                } else {
                    dta[1]--; // i mesi partono da 0
                    var ndta=new Date(dta[idx_year],dta[1],dta[idx_day]);
                    if(ndta.getFullYear()!==Number(dta[idx_year]) || ndta.getMonth()!==Number(dta[1]) || ndta.getDate()!==Number(dta[idx_day])) {
                        return false;
                    }
                }
            }
            return true;
        },


        cf_check_ora: function(str) {
            if(str.indexOf(':') === -1 || str.length > 5) {
                return false;
            } else {
                var ora=str.split(':');
                if(ora[0]===null || ora[1]===null || ora[0]==='' || ora[1]==='' ||
                    isNaN(ora[0]) || isNaN(ora[1]) ||
                    Number(ora[0]) < 0 || Number(ora[0]) > 23 ||
                    Number(ora[1]) < 0 || Number(ora[1]) > 59) {

                    return false;
                }
            }
            return true;
        },
        */

        /* !parse date */
        cf_parseDate: function(data) {

            // converte una stringa data in un oggetto data
            var str_format;
            if(/\//.test(data)) {
                str_format="DD/MM/YYYY";
            } else {
                str_format="YYYY-MM-DD";
            }

            if(/:/.test(data)) {str_format += " hh:mm";}

            return moment(data, str_format);
        },

        /* !partita iva */
        cf_partita_iva: function (piva) {
            // da http://www.icosaedro.it/cf-pi/

            piva=piva.toUpperCase();
            if(piva.substring(0,2)==='IT') {piva=piva.substring(2);}
            if( piva.length !== 11 ) {return false;}
            var  validi = "0123456789";
            for(var i = 0; i < 11; i++ ) {if( validi.indexOf( piva.charAt(i) ) === -1 ) {return false;}}
            var c, s = 0;
            // cifre pari
            for( i = 0; i <= 9; i += 2 ) {s += piva.charCodeAt(i) - '0'.charCodeAt(0);}
            // cifre dispari
            for( i = 1; i <= 9; i += 2 ) {
                c = 2*( piva.charCodeAt(i) - '0'.charCodeAt(0) );
                if( c > 9 ) { c = c - 9; }
                s += c;
            }
            if((10 - s%10) %10 !== piva.charCodeAt(10) - '0'.charCodeAt(0)) {return false;}

            return true;
        }


    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {

        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin( this, options ));
            }

            // permette di chiamare i singoli metodi al di fuori del plugin
            // (vedi http://stackoverflow.com/questions/14128446/call-methods-using-jquery-plugin-design-pattern)
            // es $('form').cf('checkform')
            else if ($.isFunction(Plugin.prototype[options])) {
                $.data(this, 'plugin_' + pluginName)[options]();
            }

        });
    };

})( jQuery, window, document );
