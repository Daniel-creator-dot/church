import React, { useState } from 'react';
import { Book, Role } from '../types';

interface BookstoreViewProps {
  activeRole: Role;
  books: Book[];
  purchasedBookIds: string[];
  currencySymbol?: string;
  currencyCode?: string;
  formatCurrency?: (amount: number) => string;
  onUpdatePurchasedBooks: (newIds: string[]) => void;
  onRecordTransaction: (transaction: { type: 'Income' | 'Expense'; category: string; amount: number; description: string }) => void;
  onUpdateBooks: (newBooks: Book[]) => void;
}

export default function BookstoreView({
  activeRole,
  books,
  purchasedBookIds,
  onUpdatePurchasedBooks,
  onRecordTransaction,
  onUpdateBooks,
  currencySymbol = '$',
  currencyCode = 'USD',
  formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`,
}: BookstoreViewProps) {
  // Navigation states
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);
  const [checkoutBookId, setCheckoutBookId] = useState<string | null>(null);

  // Reader state
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // Checkout Form states
  const [payMethod, setPayMethod] = useState<'Card' | 'Mobile Money' | 'Bank Transfer'>('Card');
  const [purchaserName, setPurchaserName] = useState('David Nkansah');
  const [accountNumber, setAccountNumber] = useState('4111 2222 3333 4444');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  // Admin New Book Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPrice, setNewPrice] = useState(10.00);
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newPagesText, setNewPagesText] = useState('');

  const selectedBook = books.find(b => b.id === selectedBookId) || null;
  const readingBook = books.find(b => b.id === readingBookId) || null;
  const checkoutBook = books.find(b => b.id === checkoutBookId) || null;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutBook) return;

    setIsProcessingPay(true);

    // Simulate payment processing delays
    setTimeout(() => {
      setIsProcessingPay(false);
      
      // Update purchased books
      const updatedPurchased = [...purchasedBookIds, checkoutBook.id];
      onUpdatePurchasedBooks(updatedPurchased);

      // Record transaction on financial ledger
      onRecordTransaction({
        type: 'Income',
        category: 'Bookstore Sale',
        amount: checkoutBook.price,
        description: `Book Bookstore Sale: "${checkoutBook.title}" purchased by ${purchaserName}`
      });

      alert(`Payment of ${formatCurrency(checkoutBook.price)} successful! "${checkoutBook.title}" is now permanently unlocked in your media library.`);
      
      // Navigate to book details
      setSelectedBookId(checkoutBook.id);
      setCheckoutBookId(null);
    }, 1500);
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;

    const customPages = newPagesText.trim() 
      ? newPagesText.split('\n\n').map((p, idx) => `Page ${idx + 1}:\n\n${p}`)
      : ['Page 1: Under Construction.\n\nNo pages added yet. Contact the author for contents.'];

    const newBook: Book = {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      author: newAuthor,
      price: Number(newPrice),
      description: newDesc,
      coverUrl: newCover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=60',
      pages: customPages
    };

    onUpdateBooks([...books, newBook]);
    setShowAddForm(false);
    
    // Clear fields
    setNewTitle('');
    setNewAuthor('');
    setNewPrice(10.00);
    setNewDesc('');
    setNewCover('');
    setNewPagesText('');
    alert(`Book "${newBook.title}" has been successfully added to the Church Bookstore catalog!`);
  };

  const handleStartReading = (book: Book) => {
    setReadingBookId(book.id);
    setCurrentPageIdx(0);
  };

  const isUnlocked = (bookId: string) => {
    // Super Admin and pastors have default access to all materials for audit
    if (activeRole === 'Super Admin' || activeRole === 'Pastor') {
      return true;
    }
    return purchasedBookIds.includes(bookId);
  };

  const isAdmin = ['Super Admin', 'Pastor', 'Church Administrator'].includes(activeRole);

  // E-book reader sub-pane
  if (readingBook) {
    const totalPages = readingBook.pages.length;
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[500px] p-6 text-slate-100 flex flex-col justify-between animate-slide-up rounded-2xl" id="book-reader">
        {/* Reader Header */}
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-4 bg-slate-800/30 backdrop-blur-sm rounded-t-2xl px-6 -mx-6 -mt-6 pt-6">
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest font-mono flex items-center gap-2">
              <i className="bi bi-book-half"></i> SANCTUARY READER
            </span>
            <h3 className="text-md font-bold uppercase tracking-tight">{readingBook.title}</h3>
            <p className="text-[11px] text-slate-400">By {readingBook.author}</p>
          </div>
          <button 
            onClick={() => setReadingBookId(null)}
            className="btn-secondary text-xs"
          >
            <i className="bi bi-x-lg mr-1"></i> Exit Reader
          </button>
        </div>

        {/* Book Page Content */}
        <div className="flex-1 max-w-2xl mx-auto w-full py-10 flex flex-col justify-center">
          <div className="bg-white text-slate-900 p-8 md:p-12 shadow-2xl border border-slate-200 rounded-2xl min-h-[350px] flex flex-col justify-between relative card-hover">
            {/* Watermark/Logo */}
            <div className="absolute top-4 right-4 text-[9px] font-mono font-bold text-slate-300 tracking-wider">
              MORNING CHURCH PRESS
            </div>
            
            {/* E-book content */}
            <div className="space-y-4">
              <p className="whitespace-pre-line text-sm leading-relaxed font-sans text-slate-800">
                {readingBook.pages[currentPageIdx]}
              </p>
            </div>

            {/* Page footer */}
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1"><i className="bi bi-book"></i> Chapter Segment</span>
              <span className="bg-slate-100 px-2 py-1 rounded-xl">Page {currentPageIdx + 1} of {totalPages}</span>
            </div>
          </div>
        </div>

        {/* Reader Navigation controls */}
        <div className="flex justify-between items-center max-w-xl mx-auto w-full border-t border-slate-700/50 pt-4 shrink-0 bg-slate-800/30 backdrop-blur-sm rounded-b-2xl px-6 -mx-6 -mb-6 pb-6">
          <button 
            disabled={currentPageIdx === 0}
            onClick={() => setCurrentPageIdx(p => Math.max(0, p - 1))}
            className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 text-xs"
          >
            <i className="bi bi-chevron-left"></i> Previous
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-32 bg-slate-700 rounded-full h-1.5">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentPageIdx + 1) / totalPages) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {Math.round(((currentPageIdx + 1) / totalPages) * 100)}%
            </span>
          </div>

          <button 
            disabled={currentPageIdx === totalPages - 1}
            onClick={() => setCurrentPageIdx(p => Math.min(totalPages - 1, p + 1))}
            className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 text-xs"
          >
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  }

  // Payment checkout overlay sub-pane
  if (checkoutBook) {
    return (
      <div className="modal-content p-6 space-y-6 max-w-xl mx-auto" id="checkout-view">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <h3 className="text-md font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <i className="bi bi-credit-card-2-front text-amber-500 text-lg"></i> Secure Checkout Portal
          </h3>
          <button 
            onClick={() => setCheckoutBookId(null)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            <i className="bi bi-x-lg"></i> Cancel
          </button>
        </div>

        {/* Purchase breakdown */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-xl flex gap-4 card-hover">
          <img 
            src={checkoutBook.coverUrl} 
            alt={checkoutBook.title} 
            className="w-20 h-24 object-cover border border-amber-200 bg-white rounded-xl shadow-sm" 
          />
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-bold text-slate-900 uppercase">{checkoutBook.title}</h4>
            <p className="text-[11px] text-slate-500">By {checkoutBook.author}</p>
            <div className="text-lg font-extrabold text-amber-500 font-mono pt-1">
              {formatCurrency(checkoutBook.price)}
            </div>
          </div>
        </div>

        {/* Checkout fields form */}
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {/* Pay method switcher */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Payment Medium</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Card', 'Mobile Money', 'Bank Transfer'] as const).map(m => (
                <button
                  id={`pay-method-${m}`}
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 text-xs font-bold border rounded-xl transition-all ${
                    payMethod === m 
                      ? 'border-amber-500 bg-amber-50 text-slate-800' 
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Account Holder Name</label>
              <input 
                id="checkout-name"
                type="text" required
                className="input-elegant"
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
              />
            </div>
            
            {payMethod === 'Card' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Card Number</label>
                  <input 
                    id="checkout-card-num"
                    type="text" required
                    placeholder="4111 2222 3333 4444"
                    className="input-elegant"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Expiry / CVV</label>
                  <input 
                    id="checkout-card-expiry"
                    type="text" required
                    placeholder="12/29"
                    className="input-elegant"
                  />
                </div>
              </div>
            )}

            {payMethod === 'Mobile Money' && (
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mobile Number / Provider</label>
                <input 
                  id="checkout-phone-num"
                  type="text" required
                  placeholder="e.g. +233 24 123 4567"
                  className="input-elegant"
                />
              </div>
            )}

            {payMethod === 'Bank Transfer' && (
              <div className="space-y-1 bg-slate-50 p-3 border border-slate-200 text-slate-600 text-[11px] leading-relaxed rounded-xl">
                <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                  <i className="bi bi-bank text-amber-500 text-xs"></i> Church Account Credentials:
                </span>
                Bank: <b>Morning Covenant Bank</b><br />
                Account: <b>1019-2453-8680</b><br />
                Account Name: <b>Morning Church Global</b>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              id="checkout-cancel-btn"
              type="button" 
              onClick={() => setCheckoutBookId(null)}
              className="flex-1 btn-secondary text-xs py-3"
            >
              Cancel
            </button>
            <button 
              id="checkout-pay-btn"
              type="submit"
              disabled={isProcessingPay}
              className="flex-1 btn-primary text-xs py-3 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isProcessingPay ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Authorizing...
                </>
              ) : (
                <><i className="bi bi-lock-fill"></i> Pay {formatCurrency(checkoutBook.price)}</>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="bookstore-view">
      {/* View Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <i className="bi bi-book-half text-amber-500 text-lg"></i> Spiritual Bookstore & Literature
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Expand your mind and strengthen your spirit with paid sermons, devotional books, and training handbooks.
          </p>
        </div>
        {isAdmin && !showAddForm && (
          <button 
            id="btn-add-book-form"
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <i className="bi bi-plus-lg"></i> Add Bookstore Book
          </button>
        )}
      </div>

      {/* Admin Add Book Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4 animate-slide-up">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <i className="bi bi-plus-circle text-amber-500"></i> Register New Publication to Store Catalog
          </h3>
          <form onSubmit={handleCreateBook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Book Title *</label>
              <input 
                id="book-title"
                type="text" required
                className="input-elegant"
                placeholder="e.g. The Armor of Light"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Author Name *</label>
              <input 
                id="book-author"
                type="text" required
                className="input-elegant"
                placeholder="e.g. Pastor John Wilson"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Sale Price ({currencyCode}) *</label>
              <input 
                id="book-price"
                type="number" step="0.01" required
                className="input-elegant"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cover Image URL</label>
              <input 
                id="book-cover"
                type="text"
                className="input-elegant"
                placeholder="https://..."
                value={newCover}
                onChange={(e) => setNewCover(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Book Description</label>
              <input 
                id="book-desc"
                type="text"
                className="input-elegant"
                placeholder="A brief summary describing the booklet content..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Book Content Pages (Separate individual pages with DOUBLE newlines/enters)
              </label>
              <textarea 
                id="book-pages"
                rows={4}
                className="input-elegant resize-none"
                placeholder="Write page content here..."
                value={newPagesText}
                onChange={(e) => setNewPagesText(e.target.value)}
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-xs">Cancel</button>
              <button type="submit" className="btn-primary text-xs">Publish to Store</button>
            </div>
          </form>
        </div>
      )}

      {/* Bookstore catalog grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map(b => {
          const unlocked = isUnlocked(b.id);
          return (
            <div key={b.id} className="bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all flex flex-col justify-between rounded-2xl card-hover overflow-hidden">
              <div className="p-6 space-y-4">
                {/* Book Cover Banner representation */}
                <div className="relative aspect-3/4 w-36 mx-auto bg-slate-100 border border-slate-200 shadow-lg overflow-hidden flex items-center justify-center rounded-xl">
                  <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                  {!unlocked && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-white/95 text-slate-900 p-3 border border-slate-300 shadow-lg flex items-center justify-center rounded-xl">
                        <i className="bi bi-lock-fill text-amber-500 text-xl"></i>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight leading-snug line-clamp-1">{b.title}</h3>
                  <p className="text-[11px] text-amber-500 font-extrabold uppercase tracking-wider">By {b.author}</p>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3 text-center">
                  {b.description}
                </p>
              </div>

              {/* Action Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-amber-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-extrabold font-mono text-slate-800">
                  {unlocked ? (
                    <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold uppercase bg-emerald-50 px-2 py-1 rounded-xl"><i className="bi bi-unlock-fill text-[11px]"></i> UNLOCKED</span>
                  ) : (
                    <span className="text-amber-500">{formatCurrency(b.price)}</span>
                  )}
                </span>
                
                {unlocked ? (
                  <button 
                    id={`btn-read-book-${b.id}`}
                    onClick={() => handleStartReading(b)}
                    className="btn-primary text-[10px] px-3.5 py-2 uppercase flex items-center gap-1.5"
                  >
                    <i className="bi bi-book-half text-amber-500"></i> Read E-Book
                  </button>
                ) : (
                  <button 
                    id={`btn-purchase-book-${b.id}`}
                    onClick={() => setCheckoutBookId(b.id)}
                    className="btn-amber text-[10px] px-3.5 py-2 uppercase flex items-center gap-1.5"
                  >
                    <i className="bi bi-coin"></i> Buy Book
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
