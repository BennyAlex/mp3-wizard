import Ember from "ember"
const {Controller, inject} = Ember
const app = requireNode('electron').remote.app

export default Controller.extend({
  title: inject.service(),
  loading: inject.service(),

  actions: {
    closeApp() {
      if(this.get('loading.isLoading')) alert('There is a running process, please wait')
      else app.quit()
    }
  }
});
