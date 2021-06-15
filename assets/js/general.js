var $radios = $('input[type="radio"]');
$radios.click(function () {
  var $this = $(this);
  if ($this.data('checked')) {
    this.checked = false;
  }
  var $otherRadios = $radios.not($this).filter('[name="'
                                               + $this.attr('name') + '"]');
  $otherRadios.prop('checked', false).data('checked', false);
  $this.data('checked', this.checked);
});

$('#close').click(function() {
    $('#responsive_modal').addClass('hide');
});