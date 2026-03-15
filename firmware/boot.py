import storage

# renaming storage to WorldPad
storage.remount("/", readonly=False)
m = storage.getmount("/")
m.label = "WorldPad"
storage.remount("/", readonly=True)
