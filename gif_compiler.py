import os
import sys
import imageio
import numpy as np

lower_threshold = 30
upper_threshold = 160
img_paths = []
root = os.getcwd()
folder_path = os.path.join(root, "uploads")



def get_img_paths():

	for path, subdirs, files in os.walk(folder_path):
		for name in files:
			imgpath = (os.path.join(path, name))
			brightness = calc_brightness(imgpath)
			if(brightness > lower_threshold and brightness < upper_threshold):
				#picture is good, add it to the list
				img_paths.append(imgpath)
				print(imgpath)




def calc_brightness(filepath):
	f = imageio.imread(filepath, as_gray=True)
	return np.mean(f)


def compile_gif(length):
	counter = 0
	with imageio.get_writer(folder_path + '.gif', mode='I', duration=0.01) as writer:
		for img in img_paths:
			f = imageio.imread(img)
			writer.append_data(f)
			counter += 1
			p = progress(counter, length)
			print(p + '% done')


def progress(index, length):
	return str(int((index/length) * 100))


get_img_paths()
#compile_gif(len(img_paths))
#print('all done!')





