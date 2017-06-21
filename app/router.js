import Ember from "ember";
import config from "./config/environment";

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL,
  title: Ember.inject.service(),

  didTransition() {
    this.set('title.currentRoute', arguments[0][1].name);
  }
});

Router.map(function () {
  this.route('rename');
  this.route('tag');
});

export default Router;
