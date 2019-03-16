
print('starting the python file..')
import numpy as np
import json
import requests
import matplotlib.pyplot as plt
import datetime
import os

r = requests.get('http://192.168.8.101/node/get/history')
history = r.json()
#print(history)

# now we got the history data --let's parse it into some a bit more useful forms

kulutus = 0

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



def doKulutusPieChart():
	elias= float(getEliasKulutus())
	heli = float(getHelinKulutus())
	fig, ax = plt.subplots(figsize=(6, 3), subplot_kw=dict(aspect="equal"))
	labels = 'Elias', 'Heli'
	sizes = [elias, heli]
	colors=  [ 'lightcoral', 'yellowgreen']
	plt.pie(sizes, labels= labels, colors = colors, autopct=lambda pct: make_autopct(pct, sizes), shadow=True, startangle=140)
	ax = plt.gca();
	plt.axis('equal')
	plt.title("Helin ja Eliaksen kulutus " + str(datetime.datetime.now()).split(" ")[0]) 
	date =str(datetime.datetime.now()).split(" ")[0]
	if os.path.isdir('uploads/'+date) != True:
		os.mkdir('uploads/'+date)
	file_name = 'kulutus_all_time.png'
	fig.savefig('uploads/' + date +'/'+ file_name, facecolor='#f5efe4')


doKulutusPieChart()
print('done')
sys.stdout.flush()




