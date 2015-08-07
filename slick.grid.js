/***
 * Contains basic SlickGrid editors.
 * @module Editors
 * @namespace Slick
 */

(function ($) {
    // register namespace
    $.extend(true, window, {
        "Slick": {
            "Editors": {
                "RangeInputsWithClear": RangeInputsWithClear,
                "PrefixSuffix": prefixSuffix
            }
        }
    });

    function RangeInputsWithClear(args, ev) {
        //The val() method never return the null so we need to use the empty string when null
        var defaultValue = {min: args.item.yellow.min || '', max: args.item.yellow.max || ''},
            target = ev ? $(ev.target) : null,
            $container = $(args.container),
            $min, $max;

        this.init = function () {
            if(target) {
                if(target[0].nodeName === 'I') {
                    $container.html('<a href="javascript:void(0)">Set Range</a>');
                } else if(target[0].nodeName === 'A') {
                    $container.html(Templates['widget/range-inputs']({min: '', max: ''}));
                    $min = $container.find('input[data-type="min"]');
                    $max = $container.find('input[data-type="max"]');
                }
            }
        };

        this.destroy = function () {
            defaultValue = $container = target = $min = $max = null;
        };

        this.focus = function () {
            !$min || $min.focus();
        };

        this.loadValue = function (item) {
            !$min || $min.val(item.yellow.min || '').select();
            !$max || $max.val(item.yellow.max || '');
        };

        this.serializeValue = function () {
            var min = $min ? $min.val() : '',
                max = $max ? $max.val() : '';

            if($.isNumeric(min) && $.isNumeric(max)) {
                return {min: min * 1, max: max * 1};
            } else {
                return {min: '', max: ''};
            }
        };

        this.applyValue = function (item, state) {
            item[args.column.field] = state;
        };

        this.isValueChanged = function () {
            if(target[0].nodeName === 'I') {
                return true;
            } else {
                return $min && $max && ($.trim($min.val()) !== defaultValue.min || $.trim($max.val()) !== defaultValue.max);
            }
        };

        this.validate = function () {
            if(target[0].nodeName === 'I') {
                return {
                    valid: true,
                    msg: ''
                };
            } else if($min && $max) {
                var min = $min.val(),
                    max = $max.val();
                if($.isNumeric(min) && $.isNumeric(max)) {
                    return {
                        valid: true,
                        msg: ''
                    };
                }
            }

            return {
                valid: false,
                msg: 'Invalid green or red values. Note: Only numeric values are allowed'
            };
        };

        this.init();
    }

    function prefixSuffix(args) {
        var tag = args.item.settings.tag,
            $container = $(args.container),
            $prefix, $suffix;

        this.init = function () {
            $prefix = $container.find('input[data-type="prefix"]');
            $suffix = $container.find('input[data-type="suffix"]');
        };

        this.destroy = function () {
            $container = tag = $prefix = $suffix = null;
        };

        this.focus = function () {
            $prefix.focus();
        };

        this.loadValue = function (item) {
            $prefix.val(item.settings.prefix);
            $suffix.val(item.settings.suffix);
        };

        this.serializeValue = function () {
            return {prefix: $.trim($prefix.val()), suffix: $.trim($suffix.val()), tag: tag};
        };

        this.applyValue = function (item, state) {
            item[args.column.field] = state;
        };

        this.isValueChanged = function () {
            return true;
        };

        this.validate = function () {
            return {
                valid: true,
                msg: ''
            };
        };

        this.init();
    }

})(jQuery);