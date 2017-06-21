import Ember from "ember";
const {Component} = Ember;

export default Component.extend({
  label: "Aktion durchführen?",
  confirmationLabel: "Bestätigen",
  cancelLabel: "Abbrechen",
  deleteLabel: "Löschen",

  clickOutsideToClose: true,
  confirmationAsWarning: false, // determines if the confirmation button should be a warn button
  onConfirm: null, // confirm action
  onClose: null, // close action
  onDelete: null, // delete action
  hideConfirmButton: false,
  hideCancelButton: false
});
