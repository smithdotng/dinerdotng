import Link from 'next/link';
import { requireOwnerSpot } from '@/lib/owner';
import { MenuItem, type IMenuItem } from '@/models/MenuItem';
import { MENU_TAGS, type MenuTag } from '@/lib/spot';
import { naira } from '@/lib/format';
import { categoryAction, deleteMenuItemAction, saveMenuItemAction, toggleMenuItemAction } from '@/actions/owner';
import { ConfirmButton, ImageInput } from '@/components/ClientBits';

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
    const { spot } = await requireOwnerSpot();
    const { edit: editId } = await searchParams;
    const items = await MenuItem.find({ spot: spot._id }).sort({ order: 1, createdAt: 1 }).lean<IMenuItem[]>();
    const cats = [...new Set([...spot.menuCategories, ...items.map((i) => i.category)])];
    const edit = editId ? items.find((i) => String(i._id) === editId) : undefined;
    const small = { width: 28, height: 28 };

    return (
        <div className="row g-4">
            <div className="col-xl-7 order-2 order-xl-1">
                <div className="card-dn">
                    <div className="card-head">
                        <h5><i className="fas fa-book-open me-2 text-primary-dn"></i>Your menu <small className="text-muted-dn fw-normal">({items.length} items)</small></h5>
                        <Link href={`/m/${spot.slug}`} target="_blank" className="btn-dn-outline btn-sm-dn"><i className="fas fa-mobile-screen"></i> Preview</Link>
                    </div>
                    {!items.length && (
                        <div className="text-center py-4"><i className="fas fa-bowl-food fa-2x text-primary-dn mb-2"></i><p className="text-muted-dn">Your menu is empty. Add your first dish using the form.</p></div>
                    )}
                    {cats.map((c) => {
                        const list = items.filter((i) => i.category === c);
                        return (
                            <div key={c} className="cat-block">
                                <div className="cat-title">
                                    <h6>{c}</h6><span className="pill pill-muted">{list.length}</span>
                                    <div className="ms-auto d-flex gap-1">
                                        <form action={categoryAction}><input type="hidden" name="op" value="up" /><input type="hidden" name="name" value={c} /><button className="btn-icon" style={small} title="Move up"><i className="fas fa-arrow-up" style={{ fontSize: 11 }}></i></button></form>
                                        <form action={categoryAction}><input type="hidden" name="op" value="down" /><input type="hidden" name="name" value={c} /><button className="btn-icon" style={small} title="Move down"><i className="fas fa-arrow-down" style={{ fontSize: 11 }}></i></button></form>
                                        {!list.length && (
                                            <form action={categoryAction}><input type="hidden" name="op" value="delete" /><input type="hidden" name="name" value={c} />
                                                <ConfirmButton message={`Remove the empty category "${c}"?`} className="btn-icon" title="Remove category"><i className="fas fa-trash" style={{ fontSize: 11 }}></i></ConfirmButton>
                                            </form>
                                        )}
                                    </div>
                                </div>
                                {list.map((i) => {
                                    const id = String(i._id);
                                    return (
                                        <div key={id} id={`item-${id}`} className={`menu-admin-item ${i.available ? '' : 'off'}`}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {i.image ? <img src={i.image} alt="" /> : <span className="ph"><i className="fas fa-utensils"></i></span>}
                                            <div className="grow">
                                                <h6>{i.name} {i.tags.map((t) => <span key={t} className="pill pill-soft ms-1" style={{ fontSize: 10, padding: '1px 7px' }}>{MENU_TAGS[t as MenuTag]?.label}</span>)}</h6>
                                                <p>{i.description || '—'}</p>
                                                <b style={{ color: 'var(--dn-primary-dark)' }}>{naira(i.price)}</b> {!i.available && <span className="pill pill-muted ms-1">Sold out</span>}
                                            </div>
                                            <div className="d-flex gap-1 flex-wrap justify-content-end" style={{ maxWidth: 130 }}>
                                                <form action={toggleMenuItemAction.bind(null, id)}><button className="btn-icon" title={i.available ? 'Mark sold out' : 'Mark available'}><i className={`fas ${i.available ? 'fa-toggle-on text-success' : 'fa-toggle-off'}`}></i></button></form>
                                                <Link className="btn-icon" href={`/dashboard/menu?edit=${id}`} title="Edit"><i className="fas fa-pen"></i></Link>
                                                <form action={deleteMenuItemAction.bind(null, id)}><ConfirmButton message={`Delete "${i.name}"?`} className="btn-icon" title="Delete"><i className="fas fa-trash"></i></ConfirmButton></form>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!list.length && <p className="small text-muted-dn">No items in this category yet.</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="col-xl-5 order-1 order-xl-2">
                <div className="card-dn" style={{ position: 'sticky', top: 80 }}>
                    <h5>{edit ? 'Edit dish' : 'Add a dish'}</h5>
                    <form action={saveMenuItemAction} key={editId || 'new'}>
                        {edit && <input type="hidden" name="id" value={String(edit._id)} />}
                        <div className="row g-3">
                            <div className="col-12"><label className="form-label">Name</label><input className="form-control" name="name" defaultValue={edit?.name} placeholder="e.g. Smoky party jollof" required /></div>
                            <div className="col-7"><label className="form-label">Category</label>
                                <input className="form-control" name="category" list="catlist" defaultValue={edit?.category || cats[0] || 'Mains'} required />
                                <datalist id="catlist">{cats.map((c) => <option key={c} value={c} />)}</datalist></div>
                            <div className="col-5"><label className="form-label">Price (₦)</label><input className="form-control" name="price" inputMode="numeric" defaultValue={edit?.price} placeholder="6500" required /></div>
                            <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" name="description" rows={2} maxLength={400} defaultValue={edit?.description} placeholder="Ingredients, portion, sides…"></textarea></div>
                            <div className="col-12"><label className="form-label">Photo</label>
                                {edit?.image && <label className="small d-block mb-1"><input type="checkbox" className="form-check-input me-1" name="removeImage" /> Remove current photo</label>}
                                <ImageInput name="image" current={edit?.image} previewClass="d-block mb-2" /></div>
                            <div className="col-12"><label className="form-label d-block">Labels</label>
                                {(Object.keys(MENU_TAGS) as MenuTag[]).map((t) => (
                                    <label key={t} className="me-3 small"><input type="checkbox" className="form-check-input me-1" name="tags" value={t} defaultChecked={edit?.tags.includes(t)} />{MENU_TAGS[t].label}</label>
                                ))}
                            </div>
                            {edit && <div className="col-12"><label className="small"><input type="checkbox" className="form-check-input me-1" name="available" defaultChecked={edit.available} /> Available (untick to show as sold out)</label></div>}
                            <div className="col-12 d-flex gap-2">
                                <button className="btn-dn flex-grow-1"><i className={`fas ${edit ? 'fa-floppy-disk' : 'fa-plus'}`}></i> {edit ? 'Save changes' : 'Add to menu'}</button>
                                {edit && <Link className="btn-dn-outline" href="/dashboard/menu">Cancel</Link>}
                            </div>
                        </div>
                    </form>
                    <hr style={{ borderColor: 'var(--dn-line)' }} />
                    <h6>Categories</h6>
                    <form action={categoryAction} className="d-flex gap-2 mb-2">
                        <input type="hidden" name="op" value="add" />
                        <input className="form-control" name="name" placeholder="New category (e.g. Soups & Swallow)" required /><button className="btn-dn-dark btn-sm-dn">Add</button>
                    </form>
                    {cats.length > 0 && (
                        <form action={categoryAction} className="d-flex gap-2">
                            <input type="hidden" name="op" value="rename" />
                            <select className="form-select" name="name">{cats.map((c) => <option key={c}>{c}</option>)}</select>
                            <input className="form-control" name="to" placeholder="Rename to…" required /><button className="btn-dn-outline btn-sm-dn">Rename</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
