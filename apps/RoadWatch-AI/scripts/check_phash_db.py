import os, sqlite3
print('db exists', os.path.exists('phash_store.sqlite'))
if os.path.exists('phash_store.sqlite'):
    conn=sqlite3.connect('phash_store.sqlite')
    for r in conn.execute('select id,image_id,phash from phashes'):
        print(r)
    conn.close()
