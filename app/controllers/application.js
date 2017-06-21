import Ember from 'ember';
const {Controller, inject} = Ember;

export default Controller.extend({
  title: inject.service(),
  loading: inject.service()
});
