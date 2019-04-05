
print('starting the python file..')
import numpy as np
import json
import requests
import matplotlib.pyplot as plt
import datetime
import os
from collections import Counter

r = requests.get('http://192.168.8.101/node/get/history')
history = r.json()


# now we got the history data --let's parse it into some a bit more useful forms


def getHelinKulutus():
	helin_kulutus = 0
	for entry in history:
		if entry['user'] =='Heli':
			helin_kulutus +=  entry['price']

	return round(helin_kulutus, 2)



def getEliasKulutus():
	elias_kulutus = 0
	for entry in history:
		if entry['user'] =='Elias':
			elias_kulutus +=  entry['price']

	return round(elias_kulutus,2)

def make_autopct(pct,data):
	absolute=float(pct/100.*np.sum(data))
	return "{:.1f}%\n{:10.2f}€".format(pct, absolute)

def parseHistory(user, column):
	data=[]
	for entry in history:
		if entry['user'] == user:
			data.append(entry[column])

	return data



def doKulutusPieChart(date):
	elias= float(getEliasKulutus())

	heli = float(getHelinKulutus())
	fig, ax = plt.subplots(figsize=(6, 3), subplot_kw=dict(aspect="equal"))
	labels = 'Elias', 'Heli'
	sizes = [elias, heli]
	colors=  [ 'lightcoral', 'yellowgreen']
	plt.pie(sizes, labels= labels, colors = colors, autopct=lambda pct: make_autopct(pct, sizes), shadow=True, startangle=140)
	ax = plt.gca();
	plt.axis('equal')
	tempEuroDate = date.split("-")
	euroDate = tempEuroDate[2] + '.' +  tempEuroDate[1] + '.' + tempEuroDate[0]
	plt.title("Helin ja Eliaksen kulutus 18.03.2019 - " + euroDate) 
	if os.path.isdir('uploads/'+date) != True:
		os.mkdir('uploads/'+date)
	file_name = 'kulutus_all_time.png'
	fig.savefig('uploads/' + date +'/'+ file_name, facecolor='#f5efe4', bbox_inches='tight')


def doMostBoughtItemBarChart(user, date):
	fig, ax = plt.subplots()
	labels, values = zip(*Counter(parseHistory(user, 'item')).most_common(6))
	indexes = np.arange(len(labels))
	plt.bar(indexes, values, alpha= 0.5, align='center')
	plt.xticks(indexes, labels)
	plt.setp(ax.get_xticklabels(), fontsize=10, rotation='45')
	plt.title(user + " ostetuimmat esineet ") 
	if os.path.isdir('uploads/'+date) != True:
		os.mkdir('uploads/'+date)
	file_name = user.lower() + '_ostetuimmat.png'
	fig.savefig('uploads/' + date +'/'+ file_name, facecolor='#f5efe4', bbox_inches='tight')



date =str(datetime.datetime.now()).split(" ")[0]
doKulutusPieChart(date)
doMostBoughtItemBarChart('Elias', date)
doMostBoughtItemBarChart('Heli', date)
print('done')
#print(Counter(parseHistory('Elias', 'item')).items().most_common(3))
sys.stdout.flush()




