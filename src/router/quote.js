const Parse = require('../util/parse');
const Embed = require('../util/embed');
const Logger = require('../util/logger');
const config = require('../config.json');

class Quote extends Parse {

	constructor (message, user) {
		super(message);
		this.messageReactionUser = user;
	}

	get quote () {
		if (this._quote) return this._quote;
		return this._quote = this.client.open[this.message.id];
	}

	set quote(obj) {
		this._quote = obj;
	}

	get target () {
		if (this._target) return this._target;
		return this._target = this.Search.users.byID(this.quote.target);
	}

	get quoteChannel () {
		let channel = this.Search.channels.byID(this.quote.channel);
		if (!channel) delete this.client.open[this.message.id];
		return channel;
	}

	async extend () {
		let params = {
			limit: 100
		};
		if (this.userm.size !== 0) params.before = this.userm.last().id;
		return await this.quoteChannel.fetchMessages(params);
	}

	async getUserm () {
		this.userm = this.quoteChannel.messages.filter(m => m.author.id === this.quote.target);
		let i = 0;
		while (this.userm.size === 0 && i < 10) {
			this.all = await this.extend();
			this.userm = this.userm.concat(this.all.filter(m => m.author.id === this.quote.target));
			i++;
		}
		return this.userm;
	}

	async getArr () {
		let userm = await this.getUserm();
		return userm.array().sort((a, b) => b.createdTimestamp - a.createdTimestamp);
	}

	async getEmbed(index) {
		const arr = await this.getArr();
		let m = arr[index];
		return new Embed(this.message.embeds[0])
			.setColor(config.colors.background)
			.setAuthor([
				this.target.tag,
				m ? m.createdAt.toString().slice(0, 21) : '-',
				'#' + this.quoteChannel.name,
				(arr.length - index) + ' / ' + arr.length
			].join(', '), this.target.avatarURL)
			.setDescription(m ? m.content : '');
	}
}

module.exports = Quote;