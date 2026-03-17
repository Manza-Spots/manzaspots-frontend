import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        configureWebView()
    }
    
    override open func capacitorDidLoad() {
        configureWebView()
    }
    
    private func configureWebView() {
        guard let webView = self.webView else {
            return
        }
        
        webView.allowsBackForwardNavigationGestures = true
        
        webView.scrollView.bounces = false
        
        webView.scrollView.contentInsetAdjustmentBehavior = .never
    }
}