import Ember from "ember";
const {Service, computed, Object: Obj} = Ember;

export default Service.extend({
  currentRoute: null,
  currentRouteName: computed('currentRoute', function () {
    return this.getNameFor(this.get('currentRoute'));
  }).readOnly(),

  registry: Obj.create({
    index: 'Index',
    rename: 'Rename Files',
    tag: 'Tag Files'
  }),

  getNameFor(route) {
    return this.get('registry').get(route) || `${route}`;
  },
});
