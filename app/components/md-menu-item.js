import Ember from "ember";
const {inject, computed, Component} = Ember;

export default Component.extend({
  title: inject.service(),
  disabled: null,
  onClick: null, // optional action

  route: null,
  showWarning: false,

  _label: computed('route', function () {
    return this.get('title').getNameFor(this.get('route'));
  }).readOnly(),

  _active: computed('title.currentRoute', 'route', function () {
    return this.get('title.currentRoute') === this.get('route');
  }).readOnly(),

  actions: {
    _onClick() {
      this.get('onClick')(this);
    },

    showWarning() {
      this.set('showWarning', true);
    },

    closeWarning() {
      this.set('showWarning', false);
    }
  }
});
